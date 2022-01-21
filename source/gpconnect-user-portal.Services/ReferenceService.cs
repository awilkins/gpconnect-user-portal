﻿using Dapper;
using gpconnect_user_portal.DAL.Enumerations;
using gpconnect_user_portal.DAL.Interfaces;
using gpconnect_user_portal.DTO.Response.Fhir;
using gpconnect_user_portal.DTO.Response.Reference;
using gpconnect_user_portal.Helpers;
using gpconnect_user_portal.Services.Interfaces;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace gpconnect_user_portal.Services
{
    public class ReferenceService : IReferenceService
    {
        private readonly IFhirRequestExecution _fhirRequestExecution;
        private readonly IDataService _dataService;
        private readonly IConfigurationService _configurationService;

        public ReferenceService(IFhirRequestExecution fhirRequestExecution, IConfigurationService configurationService, IDataService dataService)
        {
            _fhirRequestExecution = fhirRequestExecution;
            _configurationService = configurationService;
            _dataService = dataService;
        }

        public async Task<List<DTO.Response.Reference.Organisation>> GetOrganisations()
        {
            var query = "reference.get_organisations";
            var result = await _dataService.ExecuteQuery<DTO.Response.Reference.Organisation>(query);
            return result;
        }

        public async Task<DTO.Response.Reference.Organisation> GetOrganisation(string odsCode)
        {
            var query = "reference.get_organisation";
            var parameters = new DynamicParameters();
            parameters.Add("_ods_code", odsCode, DbType.String, ParameterDirection.Input);
            var result = await _dataService.ExecuteQueryFirstOrDefault<DTO.Response.Reference.Organisation>(query, parameters);
            return result;
        }

        public async Task<List<SupplierProduct>> GetSuppliersProducts()
        {
            var query = "reference.get_suppliers_products";
            var result = await _dataService.ExecuteQuery<SupplierProduct>(query);
            return result;
        }

        public async Task<EnabledSupplierProduct> GetSupplierProducts(int supplierId)
        {
            var query = "reference.get_supplier_products";
            var parameters = new DynamicParameters();
            parameters.Add("_supplier_id", supplierId, DbType.Int16, ParameterDirection.Input);
            var supplierProducts = await _dataService.ExecuteQuery<SupplierProduct>(query, parameters);
            var enabledSupplierProducts = new EnabledSupplierProduct()
            {
                SupplierProduct = supplierProducts
            };
            return enabledSupplierProducts;
        }



        public async Task<List<Site>> GetSites()
        {
            try
            {
                var organisationsWithInteractions = await _configurationService.GetFhirApiQuery(FhirApiQueryTypes.GetOrganisationsWithInteractions);
                var organisationsDetails = await _configurationService.GetFhirApiQuery(FhirApiQueryTypes.GetOrganisationDetails);

                var spineConfiguration = await _configurationService.GetSpineConfiguration();
                if (organisationsWithInteractions != null && spineConfiguration != null)
                {
                    var tokenSource = new CancellationTokenSource();
                    var token = tokenSource.Token;
                    var response = await _fhirRequestExecution.ExecuteFhirQuery<OrganisationsWithInteractions>(organisationsWithInteractions.QueryText, token, spineConfiguration.SpineFhirApiSystemsRegisterFqdn, spineConfiguration.SpineFhirApiKey);
                    var sites = response.Site;

                    var tasks = new ConcurrentBag<Task<Site>>();

                    Parallel.ForEach(response.Site, site =>
                    {
                        tasks.Add(UpdateSiteWithOrganisationDetails(spineConfiguration, token, organisationsDetails, site));
                        //tasks.Add(UpdateSiteWithSupplierDetails(spineConfiguration, token, organisationsDetails.QueryText.SearchAndReplace(new Dictionary<string, string> { { "{odsCode}", Regex.Escape(site.SupplierOdsCode) } }), site));
                    });
                    var results = await Task.WhenAll(tasks);
                    return results.ToList();
                }
            }
            catch
            {
                throw;             
            }
            return null;
        }

        private async Task<Site> UpdateSiteWithSupplierDetails(DTO.Response.Configuration.Spine spineConfiguration, CancellationToken cancellationToken, string query, Site site)
        {
            var supplierDetail = await _fhirRequestExecution.ExecuteFhirQuery<OrganisationDetail>(query, cancellationToken, spineConfiguration.SpineFhirApiDirectoryServicesFqdn, spineConfiguration.SpineFhirApiKey);
            site.SupplierName = supplierDetail?.Organisation?.Name;
            return site;
        }

        private async Task<Site> UpdateSiteWithOrganisationDetails(DTO.Response.Configuration.Spine spineConfiguration, CancellationToken cancellationToken, DTO.Response.Configuration.FhirApiQuery fhirApiQuery, Site site)
        {
            var query = fhirApiQuery.QueryText;
            var organisationDetail = await _fhirRequestExecution.ExecuteFhirQuery<OrganisationDetail>(query, cancellationToken, spineConfiguration.SpineFhirApiDirectoryServicesFqdn, spineConfiguration.SpineFhirApiKey);
            site.SiteName = organisationDetail?.SiteName;
            site.PostCode = organisationDetail?.PostCode;
            site.TelephoneNumber = organisationDetail?.TelephoneNumber;
            site.CCGOdsCode = organisationDetail?.CCGOdsCode;
            site.CCGOdsName = (await GetOrganisation(organisationDetail?.CCGOdsCode))?.Name;

            query = "";

            var supplierDetail = await _fhirRequestExecution.ExecuteFhirQuery<OrganisationDetail>(query, cancellationToken, spineConfiguration.SpineFhirApiDirectoryServicesFqdn, spineConfiguration.SpineFhirApiKey);
            site.SupplierName = supplierDetail?.Organisation?.Name;

            return site;
        }

        public async Task<Task> GetCCGs()
        {
            try
            {
                var query = await _configurationService.GetReferenceApiQuery(ReferenceApiQueryTypes.GetActiveCCGOrganisationsFromSDS);
                if (query != null)
                {
                    var tokenSource = new CancellationTokenSource();
                    var token = tokenSource.Token;
                    var response = await _fhirRequestExecution.ExecuteFhirQuery<CCG>(query.QueryText, token);
                    if (response != null)
                    {
                        await SynchroniseOrganisations(response.Organisations);
                    }
                }
                return Task.CompletedTask;
            }
            catch(Exception exc)
            {
                return Task.FromException(exc);
            }
        }

        private async Task SynchroniseOrganisations(List<DTO.Response.Reference.Organisation> organisations)
        {
            var query = "reference.synchronise_organisation";
            var parameters = new DynamicParameters();
            foreach (var organisation in organisations)
            {
                parameters.Add("_ods_code", organisation.OrgId, DbType.String, ParameterDirection.Input);
                parameters.Add("_organisation_name", organisation.Name, DbType.String, ParameterDirection.Input);
                parameters.Add("_org_status", organisation.Status, DbType.String, ParameterDirection.Input);
                parameters.Add("_org_record_class", organisation.OrgRecordClass, DbType.String, ParameterDirection.Input);
                parameters.Add("_last_change_date", organisation.LastChangeDate, DbType.DateTime, ParameterDirection.Input);
                parameters.Add("_primary_role_description", organisation.PrimaryRoleDescription, DbType.String, ParameterDirection.Input);
                parameters.Add("_primary_role_id", organisation.PrimaryRoleId, DbType.String, ParameterDirection.Input);
                parameters.Add("_organisation_link", organisation.OrgLink, DbType.String, ParameterDirection.Input);
                parameters.Add("_postcode", organisation.Postcode, DbType.String, ParameterDirection.Input);
                await _dataService.ExecuteQuery(query, parameters);
            }
        }

        public async Task<List<LookupType>> GetLookupTypes()
        {
            var query = "reference.get_lookup_types";
            var result = await _dataService.ExecuteQuery<LookupType>(query);
            return result;
        }

        public async Task<List<Lookup>> GetLookups()
        {
            var query = "reference.get_lookups";
            var result = await _dataService.ExecuteQuery<Lookup>(query);
            return result;
        }

        public async Task<List<Lookup>> GetLookup(Enumerations.LookupType lookupTypeId)
        {
            var query = "reference.get_lookup";
            var parameters = new DynamicParameters();
            parameters.Add("_lookup_type_id", (int)lookupTypeId, DbType.Int16, ParameterDirection.Input);
            var result = await _dataService.ExecuteQuery<Lookup>(query, parameters);
            return result;
        }

        public async Task AddLookup(Enumerations.LookupType lookupTypeId, string lookupValue)
        {
            var query = "reference.get_lookup";
            var parameters = new DynamicParameters();
            parameters.Add("_lookup_type_id", (int)lookupTypeId, DbType.Int16, ParameterDirection.Input);
            parameters.Add("_lookup_value", lookupValue, DbType.String, ParameterDirection.Input);
            await _dataService.ExecuteQuery(query, parameters);
        }

        public async Task DisableLookup(int lookupId, DateTime? disableDate)
        {
            var query = "reference.disable_lookup";
            var parameters = new DynamicParameters();
            parameters.Add("_lookup_id", lookupId, DbType.Int16, ParameterDirection.Input);
            if (disableDate != null)
            {
                parameters.Add("_disable_date", disableDate, DbType.DateTime, ParameterDirection.Input);
            }
            await _dataService.ExecuteQuery(query, parameters);
        }
    }
}