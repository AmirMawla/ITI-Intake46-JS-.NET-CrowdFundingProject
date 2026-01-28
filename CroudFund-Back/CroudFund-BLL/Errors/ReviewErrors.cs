using Microsoft.AspNetCore.Http;
using CroudFund_BLL.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Errors
{
    public static class ReviewErrors
    {
        public static readonly Error NotFound = new("Review.NotFound", "The specified review was not found.", 404);
        public static readonly Error NoReviewsFound = new("Review.NoReviewsFound", "No reviews found matching the criteria.", 404);
        public static readonly Error CreateFailed = new("Review.CreateFailed", "Failed to create review.", 400);
        public static readonly Error UpdateFailed = new("Review.UpdateFailed", "Failed to update review.", 400);
        public static readonly Error DeleteFailed = new("Review.DeleteFailed", "Failed to delete review.", 400);
        public static readonly Error UnauthorizedAccess = new("Review.UnauthorizedAccess", "You do not have permission to access this review.", 403);
        public static readonly Error CampaignNotFound = new("Review.CampaignNotFound", "The specified campaign was not found.", 404);
        public static readonly Error AlreadyReviewed = new("Review.AlreadyReviewed", "You have already reviewed this campaign.", 409);

    }
}
