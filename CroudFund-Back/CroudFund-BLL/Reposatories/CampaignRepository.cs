using CroudFund_BLL.Abstractions;
using CroudFund_BLL.Dtos.CampaignDto;
using CroudFund_BLL.Dtos.Common;
using CroudFund_BLL.Errors;
using CroudFund_BLL.Interfaces;
using CroudFund_DAL.Data;
using CroudFund_DAL.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Linq.Dynamic.Core;
using System.Text;

namespace CroudFund_BLL.Reposatories;

public class CampaignRepository(AppDbContext context ,  IWebHostEnvironment env) : BaseRepository<Campaign>(context), ICampaignRepository
{
    private readonly AppDbContext _context = context;
    private readonly IWebHostEnvironment _env = env;

    public async Task<Result<PaginatedList<CampaignResponse>>> GetAllCampaigns(RequestFilter request, CancellationToken cancellationToken = default)
    {
        var query = _context.Campaigns
               .AsNoTracking();

        // Apply approval status filter
        if (request.Status.HasValue)
        {
            query = query.Where(c => c.IsApproved == request.Status.Value);
        }

        // Apply search filter
        if (!string.IsNullOrEmpty(request.SearchValue))
        {
            var searchTerm = $"%{request.SearchValue.ToLower()}%";
            query = query.Where(x =>
                EF.Functions.Like(x.Title.ToLower(), searchTerm) ||
                EF.Functions.Like(x.Description.ToLower(), searchTerm)
            );
        }

        // Apply date filter
        if (request.DateFilter.HasValue)
        {
            var filterDate = request.DateFilter.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(x => x.CreatedAt.Date == filterDate.Date);
        }

        // Apply sorting
        if (!string.IsNullOrEmpty(request.SortColumn))
        {
            query = query.OrderBy($"{request.SortColumn} {request.SortDirection ?? "asc"}");
        }
        else
        {
            query = query.OrderByDescending(x => x.CreatedAt);
        }

        // Project to response
        var source = query.Select(c => new CampaignResponse(
            c.Id,
            c.Title,
            c.Description,
            c.GoalAmount,
            c.Deadline,
            c.Image,
            c.IsApproved,
            c.CreatedAt,
            c.UserId,
            c.User.FullName,
            c.CategoryId,
            c.Category.Name,
            c.Pledges
                .Where(p => p.Payment != null && p.Payment.Status == PaymentStatus.Success)
                .Sum(p => (decimal?)p.Amount) ?? 0,
            c.Pledges
                .Where(p => p.Payment != null && p.Payment.Status == PaymentStatus.Success)
                .Select(p => p.UserId)
                .Distinct()
                .Count()
        ));

        var campaigns = await PaginatedList<CampaignResponse>.CreateAsync(
            source,
            request.PageNumer,
            request.PageSize,
            cancellationToken
        );

        if (campaigns.Items.Count == 0)
            return Result.Failure<PaginatedList<CampaignResponse>>(CampaignErrors.NoCampaignsFound);

        return Result.Success(campaigns);
    }

    public async Task<Result<PaginatedList<CampaignResponse>>> GetAllApprovedCampaigns(RequestFilter request, CancellationToken cancellationToken = default)
    {
        var query = _context.Campaigns.Where(c=>c.IsApproved)
               .AsNoTracking();

        // Apply approval status filter
        if (request.Status.HasValue)
        {
            query = query.Where(c => c.IsApproved == request.Status.Value);
        }

        // Apply search filter
        if (!string.IsNullOrEmpty(request.SearchValue))
        {
            var searchTerm = $"%{request.SearchValue.ToLower()}%";
            query = query.Where(x =>
                EF.Functions.Like(x.Title.ToLower(), searchTerm) ||
                EF.Functions.Like(x.Description.ToLower(), searchTerm)
            );
        }

        // Apply date filter
        if (request.DateFilter.HasValue)
        {
            var filterDate = request.DateFilter.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(x => x.CreatedAt.Date == filterDate.Date);
        }

        // Apply sorting
        if (!string.IsNullOrEmpty(request.SortColumn))
        {
            query = query.OrderBy($"{request.SortColumn} {request.SortDirection ?? "asc"}");
        }
        else
        {
            query = query.OrderByDescending(x => x.CreatedAt);
        }

        // Project to response
        var source = query.Select(c => new CampaignResponse(
            c.Id,
            c.Title,
            c.Description,
            c.GoalAmount,
            c.Deadline,
            c.Image,
            c.IsApproved,
            c.CreatedAt,
            c.UserId,
            c.User.FullName,
            c.CategoryId,
            c.Category.Name,
            c.Pledges
                .Where(p => p.Payment != null && p.Payment.Status == PaymentStatus.Success)
                .Sum(p => (decimal?)p.Amount) ?? 0,
            c.Pledges
                .Where(p => p.Payment != null && p.Payment.Status == PaymentStatus.Success)
                .Select(p => p.UserId)
                .Distinct()
                .Count()
        ));

        var campaigns = await PaginatedList<CampaignResponse>.CreateAsync(
            source,
            request.PageNumer,
            request.PageSize,
            cancellationToken
        );

        // Return empty list instead of error - this is more RESTful and allows frontend to handle gracefully
        // Empty arrays are valid responses and don't need to be errors
        return Result.Success(campaigns);
    }

    public async Task<Result<PaginatedList<CampaignResponse>>> GetCampaignsByCategory(int categoryId, RequestFilter request, CancellationToken cancellationToken = default)
    {
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == categoryId, cancellationToken);
        if (!categoryExists)
            return Result.Failure<PaginatedList<CampaignResponse>>(CampaignErrors.CategoryNotFound);

        var query = _context.Campaigns
            .Where(c => c.CategoryId == categoryId && c.IsApproved)
            .AsNoTracking();

        // Apply approval status filter
        if (request.Status.HasValue)
        {
            query = query.Where(c => c.IsApproved == request.Status.Value);
        }

        // Apply search filter
        if (!string.IsNullOrEmpty(request.SearchValue))
        {
            var searchTerm = $"%{request.SearchValue.ToLower()}%";
            query = query.Where(x =>
                EF.Functions.Like(x.Title.ToLower(), searchTerm) ||
                EF.Functions.Like(x.Description.ToLower(), searchTerm)
            );
        }

        // Apply date filter
        if (request.DateFilter.HasValue)
        {
            var filterDate = request.DateFilter.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(x => x.CreatedAt.Date == filterDate.Date);
        }

        // Apply sorting
        if (!string.IsNullOrEmpty(request.SortColumn))
        {
            query = query.OrderBy($"{request.SortColumn} {request.SortDirection ?? "asc"}");
        }
        else
        {
            query = query.OrderByDescending(x => x.CreatedAt);
        }

        // Project to response
        var source = query.Select(c => new CampaignResponse(
            c.Id,
            c.Title,
            c.Description,
            c.GoalAmount,
            c.Deadline,
            c.Image,
            c.IsApproved,
            c.CreatedAt,
            c.UserId,
            c.User.FullName,
            c.CategoryId,
            c.Category.Name,
            c.Pledges
                .Where(p => p.Payment != null && p.Payment.Status == PaymentStatus.Success)
                .Sum(p => (decimal?)p.Amount) ?? 0,
            c.Pledges
                .Where(p => p.Payment != null && p.Payment.Status == PaymentStatus.Success)
                .Select(p => p.UserId)
                .Distinct()
                .Count()
        ));

        var campaigns = await PaginatedList<CampaignResponse>.CreateAsync(
            source,
            request.PageNumer,
            request.PageSize,
            cancellationToken
        );

        // Return empty list instead of error - this is more RESTful and allows frontend to handle gracefully
        // Empty arrays are valid responses and don't need to be errors
        return Result.Success(campaigns);
    }

    public async Task<Result<PaginatedList<CampaignResponse>>> GetCampaignsByUser(string userId, RequestFilter request, CancellationToken cancellationToken = default)
    {
        // Check if user exists
        var userExists = await _context.Users.AnyAsync(u => u.Id == userId, cancellationToken);
        if (!userExists)
            return Result.Failure<PaginatedList<CampaignResponse>>(UserErrors.NotFound);

        var query = _context.Campaigns
            .Where(c => c.UserId == userId && c.IsApproved)
            .AsNoTracking();

    

        // Apply search filter
        if (!string.IsNullOrEmpty(request.SearchValue))
        {
            var searchTerm = $"%{request.SearchValue.ToLower()}%";
            query = query.Where(x =>
                EF.Functions.Like(x.Title.ToLower(), searchTerm) ||
                EF.Functions.Like(x.Description.ToLower(), searchTerm)
            );
        }

        // Apply date filter
        if (request.DateFilter.HasValue)
        {
            var filterDate = request.DateFilter.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(x => x.CreatedAt.Date == filterDate.Date);
        }

        // Apply sorting
        if (!string.IsNullOrEmpty(request.SortColumn))
        {
            query = query.OrderBy($"{request.SortColumn} {request.SortDirection ?? "asc"}");
        }
        else
        {
            query = query.OrderByDescending(x => x.CreatedAt);
        }

        // Project to response
        var source = query.Select(c => new CampaignResponse(
            c.Id,
            c.Title,
            c.Description,
            c.GoalAmount,
            c.Deadline,
            c.Image,
            c.IsApproved,
            c.CreatedAt,
            c.UserId,
            c.User.FullName,
            c.CategoryId,
            c.Category.Name,
            c.Pledges
                .Where(p => p.Payment != null && p.Payment.Status == PaymentStatus.Success)
                .Sum(p => (decimal?)p.Amount) ?? 0,
            c.Pledges
                .Where(p => p.Payment != null && p.Payment.Status == PaymentStatus.Success)
                .Select(p => p.UserId)
                .Distinct()
                .Count()
        ));

        var campaigns = await PaginatedList<CampaignResponse>.CreateAsync(
            source,
            request.PageNumer,
            request.PageSize,
            cancellationToken
        );

        // Return empty list instead of error - this is more RESTful and allows frontend to handle gracefully
        // Empty arrays are valid responses and don't need to be errors
        return Result.Success(campaigns);
    }

    public async Task<Result<List<CampaignResponse>>> GetFeaturedCampaigns(CancellationToken cancellationToken = default)
    {
        var campaigns = await _context.Campaigns
                .Where(c => c.IsApproved == true)
                .Select(c => new
                {
                    Campaign = c,
                    TotalPaid = c.Pledges
                        .Where(p => p.Payment != null && p.Payment.Status == PaymentStatus.Success)
                        .Sum(p => (decimal?)p.Amount) ?? 0,
                    TotalDonors = c.Pledges
                        .Where(p => p.Payment != null && p.Payment.Status == PaymentStatus.Success)
                        .Select(p => p.UserId)
                        .Distinct()
                        .Count()
                })
                .OrderByDescending(x => x.TotalPaid)
                .Take(6)
                .Select(x => new CampaignResponse(
                    x.Campaign.Id,
                    x.Campaign.Title,
                    x.Campaign.Description,
                    x.Campaign.GoalAmount,
                    x.Campaign.Deadline,
                    x.Campaign.Image,
                    x.Campaign.IsApproved,
                    x.Campaign.CreatedAt,
                    x.Campaign.UserId,
                    x.Campaign.User.FullName,
                    x.Campaign.CategoryId,
                    x.Campaign.Category.Name,
                    x.TotalPaid,
                    x.TotalDonors
                ))
                .AsNoTracking()
                .ToListAsync(cancellationToken);

        // Return empty list instead of error - this is more RESTful and allows frontend to handle gracefully
        // Empty arrays are valid responses and don't need to be errors
        return Result.Success(campaigns);
    }

    public async Task<Result<PaginatedList<CampaignResponse>>> GetMyCampaigns(string userId, RequestFilter request, CancellationToken cancellationToken = default)
    {
        var query = _context.Campaigns
               .Where(c => c.UserId == userId)
               .AsNoTracking();

        // Note: LINQ queries are never null, so this check is unnecessary

        // Apply approval status filter
        if (request.Status.HasValue)
        {
            query = query.Where(c => c.IsApproved == request.Status.Value);
        }

        // Apply search filter
        if (!string.IsNullOrEmpty(request.SearchValue))
        {
            var searchTerm = $"%{request.SearchValue.ToLower()}%";
            query = query.Where(x =>
                EF.Functions.Like(x.Title.ToLower(), searchTerm) ||
                EF.Functions.Like(x.Description.ToLower(), searchTerm)
            );
        }

        // Apply date filter
        if (request.DateFilter.HasValue)
        {
            var filterDate = request.DateFilter.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(x => x.CreatedAt.Date == filterDate.Date);
        }

        // Apply sorting
        if (!string.IsNullOrEmpty(request.SortColumn))
        {
            query = query.OrderBy($"{request.SortColumn} {request.SortDirection ?? "asc"}");
        }
        else
        {
            query = query.OrderByDescending(x => x.CreatedAt);
        }

        // Project to response
        var source = query.Select(c => new CampaignResponse(
            c.Id,
            c.Title,
            c.Description,
            c.GoalAmount,
            c.Deadline,
            c.Image,
            c.IsApproved,
            c.CreatedAt,
            c.UserId,
            c.User.FullName,
            c.CategoryId,
            c.Category.Name,
            c.Pledges
                .Where(p => p.Payment != null && p.Payment.Status == PaymentStatus.Success)
                .Sum(p => (decimal?)p.Amount) ?? 0,
            c.Pledges
                .Where(p => p.Payment != null && p.Payment.Status == PaymentStatus.Success)
                .Select(p => p.UserId)
                .Distinct()
                .Count()
        ));

        var campaigns = await PaginatedList<CampaignResponse>.CreateAsync(
            source,
            request.PageNumer,
            request.PageSize,
            cancellationToken
        );

        if (campaigns.Items.Count == 0)
            return Result.Failure<PaginatedList<CampaignResponse>>(CampaignErrors.NoCampaignsFound);

        return Result.Success(campaigns);
    }

    public async Task<Result<CampaignResponse>> GetCampaignById(int campaignId, CancellationToken cancellationToken = default)
    {
        var campaign = await _context.Campaigns
            .Where(c => c.Id == campaignId)
            .Select(c => new CampaignResponse(
                c.Id,
                c.Title,
                c.Description,
                c.GoalAmount,
                c.Deadline,
                c.Image,
                c.IsApproved,
                c.CreatedAt,
                c.UserId,
                c.User.FullName,
                c.CategoryId,
                c.Category.Name,
                c.Pledges
                    .Where(p => p.Payment != null && p.Payment.Status == PaymentStatus.Success)
                    .Sum(p => (decimal?)p.Amount) ?? 0,
                c.Pledges
                    .Where(p => p.Payment != null && p.Payment.Status == PaymentStatus.Success)
                    .Select(p => p.UserId)
                    .Distinct()
                    .Count()
            ))
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken);

        if (campaign is null)
            return Result.Failure<CampaignResponse>(CampaignErrors.NotFound);

        return Result.Success(campaign);
    }

    public async Task<Result<CampaignResponse>> CreateCampaign(UpdateCampaignRequest request, string userId, CancellationToken cancellationToken = default)
    {

        if(_context.Users.All(u => u.Id != userId))
            return Result.Failure<CampaignResponse>(CampaignErrors.Unauthorized);
        // Check if category exists
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId, cancellationToken);
        if (!categoryExists)
            return Result.Failure<CampaignResponse>(CampaignErrors.CategoryNotFound);



        string? imagePath = null;
        if (request.Image != null)
        {
            var uploadsFolder = Path.Combine(_env.WebRootPath, "images", "campaigns");
            Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}_{request.Image.FileName}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using var stream = new FileStream(filePath, FileMode.Create);
            await request.Image.CopyToAsync(stream);

            imagePath = $"/images/campaigns/{uniqueFileName}";
        }


        // Create campaign
        var campaign = new Campaign
        {
            Title = request.Title,
            Description = request.Description,
            GoalAmount = request.GoalAmount,
            Deadline = request.Deadline,
            Image = imagePath ?? "/images/campaigns/default.jpg",
            UserId = userId,
            CategoryId = request.CategoryId,
            IsApproved = false, // Needs admin approval
            CreatedAt = DateTime.UtcNow
        };

        await _context.Campaigns.AddAsync(campaign, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // Return created campaign
        var createdCampaign = await _context.Campaigns
            .Where(c => c.Id == campaign.Id)
            .Select(c => new CampaignResponse(
                c.Id,
                c.Title,
                c.Description,
                c.GoalAmount,
                c.Deadline,
                c.Image,
                c.IsApproved,
                c.CreatedAt,
                c.UserId,
                c.User.FullName,
                c.CategoryId,
                c.Category.Name,
                0, // New campaign has no pledges yet
                0 // New campaign has no donors yet
            ))
            .FirstAsync(cancellationToken);

        if(createdCampaign is null)
            return Result.Failure<CampaignResponse>(CampaignErrors.CreateFailed);

        return Result.Success(createdCampaign);
    }




    public async Task<Result> UpdateCampaign(int campaignId, UpdateCampaignRequest request, string currentUserId, bool isAdmin, CancellationToken cancellationToken = default)
    {
        var campaign = await _context.Campaigns
               .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
            return Result.Failure(CampaignErrors.NotFound);

        // Check authorization: must be campaign creator or admin
        if (campaign.UserId != currentUserId && !isAdmin)
            return Result.Failure(CampaignErrors.UnauthorizedAccess);


        // Check if category exists
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId, cancellationToken);
        if (!categoryExists)
            return Result.Failure(CampaignErrors.CategoryNotFound);

        // Update campaign
        campaign.Title = request.Title;
        campaign.Description = request.Description;
        campaign.GoalAmount = request.GoalAmount;
        campaign.Deadline = request.Deadline;
        campaign.CategoryId = request.CategoryId;

        string? imagePath = null;
        if (request.Image != null)
        {
            var uploadsFolder = Path.Combine(_env.WebRootPath, "images", "campaigns");
            Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}_{request.Image.FileName}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using var stream = new FileStream(filePath, FileMode.Create);
            await request.Image.CopyToAsync(stream);

            imagePath = $"/images/campaigns/{uniqueFileName}";
            campaign.Image = imagePath;
        }

        _context.Campaigns.Update(campaign);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    public async Task<Result> UpdateCampaignApproval(int campaignId, bool? isApproved = null, CancellationToken cancellationToken = default)
    {
        var campaign = await _context.Campaigns
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
            return Result.Failure(CampaignErrors.NotFound);

        // If isApproved is provided, set explicitly; otherwise keep old toggle behavior for backward compatibility
        campaign.IsApproved = isApproved ?? !campaign.IsApproved;

        _context.Campaigns.Update(campaign);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    public async Task<Result> DeleteCampaign(int campaignId, string currentUserId, bool isAdmin, CancellationToken cancellationToken = default)
    {
        var campaign = await _context.Campaigns
            .Include(c => c.Pledges)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
            return Result.Failure(CampaignErrors.NotFound);

        // Check authorization: must be campaign creator or admin
        if (campaign.UserId != currentUserId && !isAdmin)
            return Result.Failure(CampaignErrors.UnauthorizedAccess);

        // Check if campaign has pledges
        if (campaign.Pledges.Any())
            return Result.Failure(CampaignErrors.CannotDeleteWithPledges);

        _context.Campaigns.Remove(campaign);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
