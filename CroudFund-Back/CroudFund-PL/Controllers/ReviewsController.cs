using CroudFund_BLL.Dtos.Common;
using CroudFund_BLL.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using CroudFund_BLL.Dtos.ReviewDto;
using CroudFund_BLL.Reposatories;
using System.Security.Claims;
using CroudFund_BLL.Abstractions;

namespace CroudFund_PL.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ReviewsController(IUnitOfWork unitOfWork) : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork = unitOfWork;

    [HttpPost("Campaign/{campaignid}")]
    [Authorize]
    public async Task<IActionResult> CreateReview([FromRoute] int campaignid, [FromBody] ReviewRequest request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _unitOfWork.Reviews.CreateReview(campaignid, request, userId, cancellationToken);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetReviewsByCampaign), new { campaignId = result.Value.CampaignId }, result.Value)
            : result.ToProblem();
    }


    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllReviews([FromQuery] RequestFilter request, CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.Reviews.GetAllReviews(request, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }

    [HttpGet("Campaign/{campaignId}")]
    public async Task<IActionResult> GetReviewsByCampaign(
            [FromRoute] int campaignId,
            [FromQuery] RequestFilter request,
            CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.Reviews.GetReviewsByCampaign(campaignId, request, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }


    [HttpGet("User/{userId}")]
    public async Task<IActionResult> GetReviewsByUser(
            [FromRoute] string userId,
            [FromQuery] RequestFilter request,
            CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.Reviews.GetReviewsByUser(userId, request, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }



    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMyReviews([FromQuery] RequestFilter request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _unitOfWork.Reviews.GetMyReviews(userId, request, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }

    // GET: api/Reviews/my/campaigns (Reviews on my campaigns - for Messages section)
    [HttpGet("my/campaigns")]
    [Authorize]
    public async Task<IActionResult> GetReviewsForMyCampaigns([FromQuery] RequestFilter request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _unitOfWork.Reviews.GetReviewsForMyCampaigns(userId, request, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }


    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateReview(
           [FromRoute] int id,
           [FromBody] ReviewRequest request,
           CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var isAdmin = User.IsInRole("Admin");

        var result = await _unitOfWork.Reviews.UpdateReview(id, request, userId, isAdmin, cancellationToken);
        return result.IsSuccess
            ? Ok(new { message = "Review updated successfully" })
            : result.ToProblem();
    }


    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteReview([FromRoute] int id, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var isAdmin = User.IsInRole("Admin");

        var result = await _unitOfWork.Reviews.DeleteReview(id, userId, isAdmin, cancellationToken);
        return result.IsSuccess
            ? Ok(new { message = "Review deleted successfully" })
            : result.ToProblem();
    }

}
