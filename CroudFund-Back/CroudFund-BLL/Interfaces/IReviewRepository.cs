using CroudFund_BLL.Abstractions;
using CroudFund_BLL.Dtos.Common;
using CroudFund_BLL.Dtos.ReviewDto;
using System;
using System.Collections.Generic;
using System.Text;

namespace CroudFund_BLL.Interfaces;

public interface IReviewRepository
{
    Task<Result<ReviewResponse>> CreateReview(int CampaignId ,ReviewRequest request, string userId, CancellationToken cancellationToken = default);
    Task<Result<PaginatedList<ReviewResponse>>> GetAllReviews(RequestFilter request, CancellationToken cancellationToken = default);
    Task<Result<PaginatedList<ReviewResponse>>> GetReviewsByCampaign(int campaignId, RequestFilter request, CancellationToken cancellationToken = default);
    Task<Result<PaginatedList<ReviewResponse>>> GetReviewsByUser(string userId, RequestFilter request, CancellationToken cancellationToken = default);
    Task<Result<PaginatedList<ReviewResponse>>> GetMyReviews(string userId, RequestFilter request, CancellationToken cancellationToken = default);
    Task<Result<PaginatedList<ReviewResponse>>> GetReviewsForMyCampaigns(string userId, RequestFilter request, CancellationToken cancellationToken = default);
    Task<Result> UpdateReview(int reviewId, ReviewRequest request, string currentUserId, bool isAdmin, CancellationToken cancellationToken = default);
    Task<Result> DeleteReview(int reviewId, string currentUserId, bool isAdmin, CancellationToken cancellationToken = default);
}
