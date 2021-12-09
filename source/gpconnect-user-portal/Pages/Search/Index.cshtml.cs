﻿using gpconnect_user_portal.DTO.Request;
using gpconnect_user_portal.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Threading.Tasks;

namespace gpconnect_user_portal.Pages
{
    public partial class SearchModel : SearchBaseModel
    {
        private readonly ILogger<SearchModel> _logger;
        private readonly IAggregateService _aggregateService;

        public SearchModel(ILogger<SearchModel> logger, IAggregateService aggregateService, IOptionsMonitor<DTO.Response.Configuration.General> generalOptionsDelegate) : base(aggregateService, generalOptionsDelegate)
        {
            _logger = logger;
            _aggregateService = aggregateService;
        }

        public IActionResult OnGet()
        {
            return Page();
        }

        public async Task<IActionResult> OnPostSearchAsync()
        {            
            if (ModelState.IsValid && IsValidSearch)
            {
                DisplaySearchInvalid = false;
                await GetSearchResults();
            }
            else
            {
                DisplaySearchInvalid = true;
            }
            return Page();
        }

        private async Task GetSearchResults()
        {
            try
            {
                var searchResults = await _aggregateService.QueryService.GetSites(CreateSearchRequest());
                SearchResult = searchResults;
            }
            catch
            {
                throw;
            }
        }

        private SearchRequest CreateSearchRequest()
        {
            return new SearchRequest()
            {
                ProviderOdsCode = ProviderOdsCode,
                ProviderName = ProviderName,
                CCGOdsCode = SelectedCCGOdsCode,
                CCGName = SelectedCCGName,
                FilterBy = SelectedSortOption
            };
        }

        public async Task<FileStreamResult> OnPostExportAllAsync()
        {
            var searchResults = await _aggregateService.QueryService.GetSitesForExport();
            return ExportResult(searchResults, "All GP Connect Sites Report");
        }

        public async Task<FileStreamResult> OnPostExportResultsAsync()
        {
            var searchResults = await _aggregateService.QueryService.GetSitesForExport(CreateSearchRequest());
            return ExportResult(searchResults, "GP Connect Site Report");
        }

        public IActionResult OnPostClear()
        {
            ProviderOdsCode = null;
            SelectedCCGName = null;
            SelectedCCGOdsCode = null;
            ProviderName = null;
            ModelState.Clear();
            return Page();
        }
    }
}
