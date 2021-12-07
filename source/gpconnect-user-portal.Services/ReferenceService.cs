﻿using Dapper;
using gpconnect_user_portal.DAL.Enumerations;
using gpconnect_user_portal.DAL.Interfaces;
using gpconnect_user_portal.DTO.Response;
using gpconnect_user_portal.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Data;
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

        public async Task<List<Organisation>> GetOrganisations()
        {
            var query = "reference.get_organisations";
            var result = await _dataService.ExecuteQuery<Organisation>(query);
            return result;
        }

        public async Task<Organisation> GetOrganisation(string odsCode)
        {
            var query = "reference.get_organisation";
            var parameters = new DynamicParameters();
            parameters.Add("_ods_code", odsCode, DbType.String, ParameterDirection.Input);
            var result = await _dataService.ExecuteQueryFirstOrDefault<Organisation>(query, parameters);
            return result;
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

        private async Task SynchroniseOrganisations(List<Organisation> organisations)
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
    }
}
