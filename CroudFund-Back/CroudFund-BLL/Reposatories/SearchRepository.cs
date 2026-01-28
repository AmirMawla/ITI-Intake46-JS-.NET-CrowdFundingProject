using CroudFund_BLL.Interfaces;
using CroudFund_DAL.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using CroudFund_BLL.Abstractions;
using CroudFund_BLL.Interfaces;
using CroudFund_DAL.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ServiceProvider_BLL.Dtos.SearchDto;

namespace ServiceProvider_BLL.Reposatories
{
    public class SearchRepository(AppDbContext context) : ISearchRepository
    {
        private readonly AppDbContext _context = context;

        //public async Task<Result<IEnumerable<GlobalSearchResponse>>> GlobalSearchAsync(string searchTerm, int maxResultsPerType = 50, CancellationToken cancellationToken = default)
        //{
        //    // Input validation
        //    if (string.IsNullOrWhiteSpace(searchTerm))
        //        return Result.Failure<IEnumerable<GlobalSearchResponse>>(
        //            new Error("Validation", "Search term cannot be empty", StatusCodes.Status400BadRequest));

        //    // Normalize search term once
        //    var normalizedTerm = $"%{searchTerm.Trim().ToLower()}%";

        //    try
        //    {
        //        // Using a dictionary to organize and track search tasks
        //        var searchTasks = new Dictionary<string, Task<List<GlobalSearchResponse>>>
        //        {
        //            ["User"] = SearchUsersAsync(normalizedTerm, maxResultsPerType, cancellationToken),
        //            ["Campaign"] = SearchCampaignsAsync(normalizedTerm, maxResultsPerType, cancellationToken),
        //            ["Category"] = SearchCategoriesAsync(normalizedTerm, maxResultsPerType, cancellationToken)
        //        };

        //        // Wait for all tasks to complete
        //        await Task.WhenAll(searchTasks.Values);

        //        // Combine and sort results
        //        var results = searchTasks.Values
        //            .SelectMany(task => task.Result)
        //            .OrderBy(x => x.Type)
        //            .ToList();

        //        return results.Any()
        //            ? Result.Success<IEnumerable<GlobalSearchResponse>>(results)
        //            : Result.Failure<IEnumerable<GlobalSearchResponse>>(
        //                new Error("Search", "No results found", StatusCodes.Status404NotFound));
        //    }
        //    catch (Exception ex)
        //    {
        //        return Result.Failure<IEnumerable<GlobalSearchResponse>>(
        //            new Error("Search", $"An error occurred while searching: {ex.Message}", StatusCodes.Status500InternalServerError));
        //    }

        //    // Helper methods for each search type
        //    async Task<List<GlobalSearchResponse>> SearchUsersAsync(string term, int limit, CancellationToken ct)
        //    {


        //        return await _context.Users
        //            .Where(u => u.FullName != null && (
        //                EF.Functions.Like(u.FullName.ToLower(), term) ||
        //                EF.Functions.Like(u.Email.ToLower(), term)))
        //            .Select(u => new GlobalSearchResponse(
        //                "User",
        //                u.Id,
        //                 u.FullName,
        //                u.Email,
        //               u.ProfileImage,
        //                null,
        //                null,
        //                null,
        //                 null,
        //               null ,
        //               null))
        //            .Take(limit)
        //            .AsNoTracking()
        //            .ToListAsync(ct);
        //    }

        //    async Task<List<GlobalSearchResponse>> SearchCampaignsAsync(string term, int limit, CancellationToken ct)
        //    {


        //        return await _context.Campaigns!
        //            .Where(p =>
        //                EF.Functions.Like(p.Title.ToLower(), term) ||
        //                EF.Functions.Like(p.Description.ToLower(), term))
        //            .Select(p => new GlobalSearchResponse(
        //                "Campaign",
        //                null,
        //                null,
        //                null,
        //                null ,
        //                p.Id,
        //                p.Title,
        //                p.Description,
        //                p.Image ,
        //                p.Category.Name,
        //                p.CategoryId
        //               ))
        //            .Take(limit)
        //            .AsNoTracking()
        //            .ToListAsync(ct);
        //    }

        //    async Task<List<GlobalSearchResponse>> SearchCategoriesAsync(string term, int limit, CancellationToken ct)
        //    {


        //        return await _context.Categories!
        //            .Where(c =>
        //                EF.Functions.Like(c.Name.ToLower(), term))
        //            .Select(c => new GlobalSearchResponse(
        //                "Category",
        //                null,
        //                null,
        //                null,
        //                null,
        //                null,
        //                null,
        //                null,
        //                null,
        //                c.Name ,
        //                c.Id))
        //            .Take(limit)
        //            .AsNoTracking()
        //            .ToListAsync(ct);
        //    }
        //}
        public async Task<Result<IEnumerable<GlobalSearchResponse>>> GlobalSearchAsync(string searchTerm, int maxResultsPerType = 50, CancellationToken cancellationToken = default)
        {
            // Input validation
            if (string.IsNullOrWhiteSpace(searchTerm))
                return Result.Failure<IEnumerable<GlobalSearchResponse>>(
                    new Error("Validation", "Search term cannot be empty", StatusCodes.Status400BadRequest));

            // Normalize search term once
            var normalizedTerm = $"%{searchTerm.Trim().ToLower()}%";

            try
            {
                // Execute searches sequentially
                var userResults = await SearchUsersAsync(normalizedTerm, maxResultsPerType, cancellationToken);
                var CampaignResults = await SearchCampaignsAsync(normalizedTerm, maxResultsPerType, cancellationToken);
                var categoryResults = await SearchCategoriesAsync(normalizedTerm, maxResultsPerType, cancellationToken);

                // Combine results
                var results = new List<GlobalSearchResponse>();
                results.AddRange(userResults);
                results.AddRange(CampaignResults);
                results.AddRange(categoryResults);

                // Sort combined results
                var orderedResults = results
                    .OrderBy(x => x.Type)
                    .ToList();

                // Return empty list instead of error - this is more RESTful and allows frontend to handle gracefully
                // Empty arrays are valid responses and don't need to be errors
                return Result.Success<IEnumerable<GlobalSearchResponse>>(orderedResults);
            }
            catch (Exception ex)
            {
                // Log the exception for debugging
                // In production, you might want to use a proper logging framework
                return Result.Failure<IEnumerable<GlobalSearchResponse>>(
                    new Error("Search", $"An error occurred while searching: {ex.Message}", StatusCodes.Status500InternalServerError));
            }

            // Helper methods remain unchanged
            async Task<List<GlobalSearchResponse>> SearchUsersAsync(string term, int limit, CancellationToken ct)
            {
                return await _context.Users
                               .Where(u => u.FullName != null && (
                                   EF.Functions.Like(u.FullName.ToLower(), term) ||
                                   EF.Functions.Like(u.Email.ToLower(), term)))
                               .Select(u => new GlobalSearchResponse(
                                   "User",
                                   u.Id,
                                    u.FullName,
                                   u.Email,
                                  u.ProfileImage,
                                   null,
                                   null,
                                   null,
                                    null,
                                  null,
                                  null))
                   .Take(limit)
                    .AsNoTracking()
                    .ToListAsync(ct);
            }

            async Task<List<GlobalSearchResponse>> SearchCampaignsAsync(string term, int limit, CancellationToken ct)
            {
                // Search approved campaigns by:
                // 1. Campaign title or description
                // 2. User's full name or email (to find campaigns by user)
                
                // First, find user IDs that match the search term
                var matchingUserIds = await _context.Users
                    .Where(u => (u.FullName != null && EF.Functions.Like(u.FullName.ToLower(), term)) ||
                                EF.Functions.Like(u.Email.ToLower(), term))
                    .Select(u => u.Id)
                    .ToListAsync(ct);
                
                // Now search campaigns by title/description OR by matching user IDs
                // Join with Category to get category name
                var campaigns = await _context.Campaigns!
                                .Where(p => p.IsApproved && (
                                    // Match campaign title or description
                                    EF.Functions.Like(p.Title.ToLower(), term) ||
                                    EF.Functions.Like(p.Description.ToLower(), term) ||
                                    // Match user IDs from the search
                                    matchingUserIds.Contains(p.UserId)))
                                .Join(_context.Categories,
                                    campaign => campaign.CategoryId,
                                    category => category.Id,
                                    (campaign, category) => new GlobalSearchResponse(
                                        "Campaign",
                                        null,
                                        null,
                                        null,
                                        null,
                                        campaign.Id,
                                        campaign.Title,
                                        campaign.Description,
                                        campaign.Image,
                                        category.Name,
                                        campaign.CategoryId
                                    ))
                    .Take(limit)
                    .AsNoTracking()
                    .ToListAsync(ct);
                
                return campaigns;
            }

            async Task<List<GlobalSearchResponse>> SearchCategoriesAsync(string term, int limit, CancellationToken ct)
            {
                return await _context.Categories!
                    .Where(c =>
                        EF.Functions.Like(c.Name.ToLower(), term))
                    .Select(c => new GlobalSearchResponse(
                        "Category",
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        c.Name,
                        c.Id))
                    .Take(limit)
                    .AsNoTracking()
                    .ToListAsync(ct);
            }
        }
    }
}
