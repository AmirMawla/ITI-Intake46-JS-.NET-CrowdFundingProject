using CroudFund_BLL.Abstractions;
using CroudFund_BLL.Dtos.Common;
using CroudFund_BLL.Errors;
using CroudFund_BLL.Interfaces;
using CroudFund_DAL.Data;
using CroudFund_DAL.Entities;
using Microsoft.EntityFrameworkCore;
using CroudFund_BLL.Dtos.ReviewDto;
using System;
using System.Collections.Generic;
using System.Text;
using System.Linq.Dynamic.Core;

namespace CroudFund_BLL.Reposatories;

public class ReviewRepository(AppDbContext context) : BaseRepository<Review>(context), IReviewRepository
{
    private readonly AppDbContext _context = context;
    public async Task<Result<ReviewResponse>> CreateReview(int CampaignId, ReviewRequest request, string userId, CancellationToken cancellationToken = default)
    {
        // Check if campaign exists
        var campaignExists = await _context.Campaigns
            .AnyAsync(c => c.Id == CampaignId, cancellationToken);

        if (!campaignExists)
            return Result.Failure<ReviewResponse>(ReviewErrors.CampaignNotFound);

        // Check if user already reviewed this campaign
        var alreadyReviewed = await _context.Reviews
            .AnyAsync(r => r.UserId == userId && r.CampaignId == CampaignId, cancellationToken);


        if (alreadyReviewed)
            return Result.Failure<ReviewResponse>(ReviewErrors.AlreadyReviewed);


        // Create review
        var review = new Review
        {
            Comment = request.Comment,
            Reaction = request.Reaction,
            CampaignId = CampaignId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Reviews.AddAsync(review, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // Return created review
        var createdReview = await _context.Reviews
            .Where(r => r.Id == review.Id)
            .Select(r => new ReviewResponse(
                r.Id,
                r.Comment,
                r.Reaction,
                r.CreatedAt,
                r.UserId,
                r.User.FullName,
                r.User.ProfileImage,
                r.CampaignId,
                r.Campaign.Title
            ))
            .FirstAsync(cancellationToken);

        return Result.Success(createdReview);
    }

    public async Task<Result> DeleteReview(int reviewId, string currentUserId, bool isAdmin, CancellationToken cancellationToken = default)
    {
        var review = await _context.Reviews
                .Include(r => r.Campaign)
                .FirstOrDefaultAsync(r => r.Id == reviewId, cancellationToken);

        if (review is null)
            return Result.Failure(ReviewErrors.NotFound);

        // Check authorization: must be review owner, campaign owner, or admin
        var isCampaignOwner = review.Campaign.UserId == currentUserId;
        var isReviewOwner = review.UserId == currentUserId;

        if (!isReviewOwner && !isCampaignOwner && !isAdmin)
            return Result.Failure(ReviewErrors.UnauthorizedAccess);

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    public async Task<Result<PaginatedList<ReviewResponse>>> GetAllReviews(RequestFilter request, CancellationToken cancellationToken = default)
    {
        var query = _context.Reviews.AsNoTracking();

        // Apply search filter
        if (!string.IsNullOrEmpty(request.SearchValue))
        {
            var searchTerm = $"%{request.SearchValue.ToLower()}%";
            query = query.Where(r =>
                EF.Functions.Like(r.Comment.ToLower(), searchTerm) ||
                EF.Functions.Like(r.User.FullName.ToLower(), searchTerm) ||
                EF.Functions.Like(r.Campaign.Title.ToLower(), searchTerm)
            );
        }

        // Apply date filter
        if (request.DateFilter.HasValue)
        {
            var filterDate = request.DateFilter.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(r => r.CreatedAt.Date == filterDate.Date);
        }

        // Apply sorting
        if (!string.IsNullOrEmpty(request.SortColumn))
        {
            query = query.OrderBy($"{request.SortColumn} {request.SortDirection ?? "asc"}");
        }
        else
        {
            query = query.OrderByDescending(r => r.CreatedAt);
        }

        // Project to response
        var source = query.Select(r => new ReviewResponse(
            r.Id,
            r.Comment,
            r.Reaction,
            r.CreatedAt,
            r.UserId,
            r.User.FullName,
            r.User.ProfileImage,
            r.CampaignId,
            r.Campaign.Title
        ));

        var reviews = await PaginatedList<ReviewResponse>.CreateAsync(
            source,
            request.PageNumer,
            request.PageSize,
            cancellationToken
        );

        // Return empty list instead of error - this is more RESTful and allows frontend to handle gracefully
        // Empty arrays are valid responses and don't need to be errors
        return Result.Success(reviews);
    }

    public async Task<Result<PaginatedList<ReviewResponse>>> GetMyReviews(string userId, RequestFilter request, CancellationToken cancellationToken = default)
    {
        var query = _context.Reviews
                .Where(r => r.UserId == userId)
                .AsNoTracking();

        // Apply search filter
        if (!string.IsNullOrEmpty(request.SearchValue))
        {
            var searchTerm = $"%{request.SearchValue.ToLower()}%";
            query = query.Where(r =>
                EF.Functions.Like(r.Comment.ToLower(), searchTerm) ||
                EF.Functions.Like(r.Campaign.Title.ToLower(), searchTerm)
            );
        }

        // Apply date filter
        if (request.DateFilter.HasValue)
        {
            var filterDate = request.DateFilter.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(r => r.CreatedAt.Date == filterDate.Date);
        }

        // Apply sorting
        if (!string.IsNullOrEmpty(request.SortColumn))
        {
            query = query.OrderBy($"{request.SortColumn} {request.SortDirection ?? "asc"}");
        }
        else
        {
            query = query.OrderByDescending(r => r.CreatedAt);
        }

        // Project to response
        var source = query.Select(r => new ReviewResponse(
            r.Id,
            r.Comment,
            r.Reaction,
            r.CreatedAt,
            r.UserId,
            r.User.FullName,
            r.User.ProfileImage,
            r.CampaignId,
            r.Campaign.Title
        ));

        var reviews = await PaginatedList<ReviewResponse>.CreateAsync(
            source,
            request.PageNumer,
            request.PageSize,
            cancellationToken
        );

        // Return empty list instead of error - this is more RESTful and allows frontend to handle gracefully
        // Empty arrays are valid responses and don't need to be errors
        return Result.Success(reviews);

    }

    public async Task<Result<PaginatedList<ReviewResponse>>> GetReviewsByCampaign(int campaignId, RequestFilter request, CancellationToken cancellationToken = default)
    {
        // Check if campaign exists
        var campaignExists = await _context.Campaigns.AnyAsync(c => c.Id == campaignId, cancellationToken);
        if (!campaignExists)
            return Result.Failure<PaginatedList<ReviewResponse>>(ReviewErrors.CampaignNotFound);

        var query = _context.Reviews
            .Where(r => r.CampaignId == campaignId)
            .AsNoTracking();

        // Apply search filter
        if (!string.IsNullOrEmpty(request.SearchValue))
        {
            var searchTerm = $"%{request.SearchValue.ToLower()}%";
            query = query.Where(r =>
                EF.Functions.Like(r.Comment.ToLower(), searchTerm) ||
                EF.Functions.Like(r.User.FullName.ToLower(), searchTerm)
            );
        }

        // Apply date filter
        if (request.DateFilter.HasValue)
        {
            var filterDate = request.DateFilter.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(r => r.CreatedAt.Date == filterDate.Date);
        }

        // Apply sorting
        if (!string.IsNullOrEmpty(request.SortColumn))
        {
            query = query.OrderBy($"{request.SortColumn} {request.SortDirection ?? "asc"}");
        }
        else
        {
            query = query.OrderByDescending(r => r.CreatedAt);
        }

        // Project to response
        var source = query.Select(r => new ReviewResponse(
            r.Id,
            r.Comment,
            r.Reaction,
            r.CreatedAt,
            r.UserId,
            r.User.FullName,
            r.User.ProfileImage,
            r.CampaignId,
            r.Campaign.Title
        ));

        var reviews = await PaginatedList<ReviewResponse>.CreateAsync(
            source,
            request.PageNumer,
            request.PageSize,
            cancellationToken
        );

        // Return empty list instead of error - this is more RESTful and allows frontend to handle gracefully
        // Empty arrays are valid responses and don't need to be errors
        return Result.Success(reviews);
    }

    public async Task<Result<PaginatedList<ReviewResponse>>> GetReviewsByUser(string userId, RequestFilter request, CancellationToken cancellationToken = default)
    {
        // Check if user exists
        var userExists = await _context.Users.AnyAsync(u => u.Id == userId, cancellationToken);
        if (!userExists)
            return Result.Failure<PaginatedList<ReviewResponse>>(UserErrors.NotFound);

        var query = _context.Reviews
            .Where(r => r.UserId == userId)
            .AsNoTracking();

        // Apply search filter
        if (!string.IsNullOrEmpty(request.SearchValue))
        {
            var searchTerm = $"%{request.SearchValue.ToLower()}%";
            query = query.Where(r =>
                EF.Functions.Like(r.Comment.ToLower(), searchTerm) ||
                EF.Functions.Like(r.Campaign.Title.ToLower(), searchTerm)
            );
        }

        // Apply date filter
        if (request.DateFilter.HasValue)
        {
            var filterDate = request.DateFilter.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(r => r.CreatedAt.Date == filterDate.Date);
        }

        // Apply sorting
        if (!string.IsNullOrEmpty(request.SortColumn))
        {
            query = query.OrderBy($"{request.SortColumn} {request.SortDirection ?? "asc"}");
        }
        else
        {
            query = query.OrderByDescending(r => r.CreatedAt);
        }

        // Project to response
        var source = query.Select(r => new ReviewResponse(
            r.Id,
            r.Comment,
            r.Reaction,
            r.CreatedAt,
            r.UserId,
            r.User.FullName,
            r.User.ProfileImage,
            r.CampaignId,
            r.Campaign.Title
        ));

        var reviews = await PaginatedList<ReviewResponse>.CreateAsync(
            source,
            request.PageNumer,
            request.PageSize,
            cancellationToken
        );

        // Return empty list instead of error - this is more RESTful and allows frontend to handle gracefully
        // Empty arrays are valid responses and don't need to be errors
        return Result.Success(reviews);
    }

    // Get reviews for campaigns owned by the user (for Messages section)
    public async Task<Result<PaginatedList<ReviewResponse>>> GetReviewsForMyCampaigns(string userId, RequestFilter request, CancellationToken cancellationToken = default)
    {
        // Get reviews for campaigns where the user is the owner
        var query = _context.Reviews
            .Include(r => r.Campaign)
            .Include(r => r.User)
            .Where(r => r.Campaign.UserId == userId)
            .AsNoTracking();

        // Apply search filter
        if (!string.IsNullOrEmpty(request.SearchValue))
        {
            var searchTerm = $"%{request.SearchValue.ToLower()}%";
            query = query.Where(r =>
                EF.Functions.Like(r.Comment.ToLower(), searchTerm) ||
                EF.Functions.Like(r.Campaign.Title.ToLower(), searchTerm) ||
                EF.Functions.Like(r.User.FullName.ToLower(), searchTerm)
            );
        }

        // Apply date filter
        if (request.DateFilter.HasValue)
        {
            var filterDate = request.DateFilter.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(r => r.CreatedAt.Date == filterDate.Date);
        }

        // Apply sorting
        if (!string.IsNullOrEmpty(request.SortColumn))
        {
            query = query.OrderBy($"{request.SortColumn} {request.SortDirection ?? "asc"}");
        }
        else
        {
            query = query.OrderByDescending(r => r.CreatedAt);
        }

        // Project to response
        var source = query.Select(r => new ReviewResponse(
            r.Id,
            r.Comment,
            r.Reaction,
            r.CreatedAt,
            r.UserId,
            r.User.FullName,
            r.User.ProfileImage,
            r.CampaignId,
            r.Campaign.Title
        ));

        var reviews = await PaginatedList<ReviewResponse>.CreateAsync(
            source,
            request.PageNumer,
            request.PageSize,
            cancellationToken
        );

        // Return empty list instead of error - this is more RESTful and allows frontend to handle gracefully
        // Empty arrays are valid responses and don't need to be errors
        return Result.Success(reviews);
    }

    public async Task<Result> UpdateReview(int reviewId, ReviewRequest request, string currentUserId, bool isAdmin, CancellationToken cancellationToken = default)
    {
        var review = await _context.Reviews
                .FirstOrDefaultAsync(r => r.Id == reviewId, cancellationToken);

        if (review is null)
            return Result.Failure(ReviewErrors.NotFound);

        // Check authorization: must be review owner or admin
        if (review.UserId != currentUserId && !isAdmin)
            return Result.Failure(ReviewErrors.UnauthorizedAccess);

        // Update review
        review.Comment = request.Comment;
        review.Reaction = request.Reaction;

        _context.Reviews.Update(review);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
