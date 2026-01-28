using CroudFund_BLL.Abstractions;
using CroudFund_BLL.Dtos.CampaignDto;
using CroudFund_BLL.Dtos.Common;
using CroudFund_BLL.Interfaces;
using CroudFund_BLL.Interfaces;
using CroudFund_BLL.Reposatories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using CroudFund_BLL.Dtos.UserDto;
using System.Security.Claims;
namespace CroudFund_PL.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CampaignsController(IUnitOfWork unitOfWork) : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork = unitOfWork;

    [HttpGet("")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllCampaigns([FromQuery]RequestFilter request, CancellationToken cancellationToken)
    {

        var result = await _unitOfWork.Campaigns.GetAllCampaigns(request, cancellationToken);

        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }

    // GET: api/campaigns/pending (Admin only)
    // Returns all campaigns that are not yet approved (IsApproved == false)
    [HttpGet("pending")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetPendingCampaigns([FromQuery] RequestFilter request, CancellationToken cancellationToken)
    {
        // Force status filter to false regardless of what comes from query string
        var pendingRequest = request with { Status = false };

        var result = await _unitOfWork.Campaigns.GetAllCampaigns(pendingRequest, cancellationToken);

        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }


    [HttpGet("Approved")]
    public async Task<IActionResult> GetAllActiveCampaigns([FromQuery]RequestFilter request, CancellationToken cancellationToken)
    {

        var result = await _unitOfWork.Campaigns.GetAllApprovedCampaigns(request, cancellationToken);

        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }


    [HttpGet("category/{categoryId}")]
    public async Task<IActionResult> GetCampaignsByCategory(
           [FromRoute] int categoryId,
           [FromQuery] RequestFilter request,
           CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.Campaigns.GetCampaignsByCategory(categoryId, request, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }


    [HttpGet("user/{userId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetCampaignsByUser(
           [FromRoute] string userId,
           [FromQuery] RequestFilter request,
           CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.Campaigns.GetCampaignsByUser(userId, request, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }


    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMyCampaigns([FromQuery] RequestFilter request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _unitOfWork.Campaigns.GetMyCampaigns(userId, request, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }



    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateCampaign([FromForm] UpdateCampaignRequest request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _unitOfWork.Campaigns.CreateCampaign(request, userId, cancellationToken);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetCampaignById), new { id = result.Value.Id }, result.Value)
            : result.ToProblem();
    }


    [HttpGet("{id}")]
    public async Task<IActionResult> GetCampaignById([FromRoute] int id, CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.Campaigns.GetCampaignById(id, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }



[HttpGet("featured")]
    public async Task<IActionResult> GetFeaturedCampaigns(CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.Campaigns.GetFeaturedCampaigns(cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }


    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateCampaign(
            [FromRoute] int id,
            [FromForm] UpdateCampaignRequest request,
            CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var isAdmin = User.IsInRole("Admin");
        
        var result = await _unitOfWork.Campaigns.UpdateCampaign(id, request, userId, isAdmin, cancellationToken);
        return result.IsSuccess
            ? Ok(new { message = "Campaign updated successfully" })
            : result.ToProblem();
    }


    [HttpPut("{id}/approval")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateCampaignApproval(
            [FromRoute] int id,
            [FromQuery] bool? isApproved,
            CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.Campaigns.UpdateCampaignApproval(id, isApproved, cancellationToken);
        return result.IsSuccess
            ? Ok(new { message = "Campaign approval status updated successfully" })
            : result.ToProblem();
    }

    // DELETE: api/campaigns/{id} (Delete campaign - Creator or Admin)
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteCampaign([FromRoute] int id, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var isAdmin = User.IsInRole("Admin");

        var result = await _unitOfWork.Campaigns.DeleteCampaign(id, userId, isAdmin, cancellationToken);
        return result.IsSuccess
            ? Ok(new { message = "Campaign deleted successfully" })
            : result.ToProblem();
    }


}
