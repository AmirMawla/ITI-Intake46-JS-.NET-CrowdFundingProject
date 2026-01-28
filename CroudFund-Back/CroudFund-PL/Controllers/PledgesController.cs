using CroudFund_BLL.Abstractions;
using CroudFund_BLL.Dtos.Common;
using CroudFund_BLL.Dtos.PledgeDto;
using CroudFund_BLL.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
namespace CroudFund_PL.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PledgesController(IUnitOfWork unitOfWork) : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork = unitOfWork;



    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetPledge([FromRoute] int id, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        bool IsAdmin = User.IsInRole("Admin");

        var result = await _unitOfWork.Pledges.GetPledgeAsync(id, userId!, IsAdmin , cancellationToken);

        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }




    [HttpPost("Campaign/{campaignid}")]
    [Authorize]
    public async Task<IActionResult> AddPledge([FromRoute] int campaignid  ,[FromBody] PledgeRequest request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var result = await _unitOfWork.Pledges.AddPledgeAsync(userId!, campaignid, request, cancellationToken);

        return result.IsSuccess
            ? CreatedAtAction(nameof(GetPledge), new { id = result.Value.Id }, result.Value)
            : result.ToProblem();
    }


    // ============================================
    // User Transaction Endpoints
    // ============================================

    // GET: api/pledges/my/donations (My donations - money I gave)
    [HttpGet("my/donations")]
    [Authorize]
    public async Task<IActionResult> GetMyDonations(
        [FromQuery] RequestFilter request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _unitOfWork.Pledges.GetMyDonations(userId, request, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }

    // GET: api/pledges/my/collections (My collections - money collected from my campaigns)
    [HttpGet("my/collections")]
    [Authorize]
    public async Task<IActionResult> GetMyCollections(
        [FromQuery] RequestFilter request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _unitOfWork.Pledges.GetMyCollections(userId, request, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }

    // GET: api/pledges/my/summary (My transaction summary)
    [HttpGet("my/summary")]
    [Authorize]
    public async Task<IActionResult> GetMyTransactionSummary(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _unitOfWork.Pledges.GetMyTransactionSummary(userId, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }

    // GET: api/pledges/my/dashboard (My dashboard statistics)
    [HttpGet("my/dashboard")]
    [Authorize]
    public async Task<IActionResult> GetMyDashboardStatistics(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _unitOfWork.Pledges.GetUserDashboardStatistics(userId, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }

    // GET: api/pledges/my/financial-performance (My monthly collected vs donated)
    [HttpGet("my/financial-performance")]
    [Authorize]
    public async Task<IActionResult> GetMyFinancialPerformance(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _unitOfWork.Pledges.GetUserMonthlyFinancialPerformance(userId, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }

    // ============================================
    // Admin Transaction Endpoints
    // ============================================

    // GET: api/pledges (Get all pledges - Admin)
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllPledges(
        [FromQuery] RequestFilter request,
        CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.Pledges.GetAllPledges(request, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }

    // GET: api/pledges/campaign/{campaignId} (Get pledges by campaign - Admin)
    [HttpGet("campaign/{campaignId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetPledgesByCampaign(
        [FromRoute] int campaignId,
        [FromQuery] RequestFilter request,
        CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.Pledges.GetPledgesByCampaign(campaignId, request, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }

    // GET: api/pledges/user/{userId} (Get pledges by user - Admin)
    [HttpGet("user/{userId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetPledgesByUser(
        [FromRoute] string userId,
        [FromQuery] RequestFilter request,
        CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.Pledges.GetPledgesByUser(userId, request, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }

    // GET: api/pledges/user/{userId}/summary (Get user transaction summary - Admin)
    [HttpGet("user/{userId}/summary")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetUserTransactionSummary(
        [FromRoute] string userId,
        CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.Pledges.GetUserTransactionSummary(userId, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }

    // ============================================
    // Analytics & Statistics Endpoints (Admin)
    // ============================================

    // GET: api/pledges/analytics/statistics (Transaction statistics)
    [HttpGet("analytics/statistics")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetTransactionStatistics(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.Pledges.GetTransactionStatistics(startDate, endDate, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }

    // GET: api/pledges/analytics/top-donors (Top donors - Public)
    [HttpGet("analytics/top-donors")]
    public async Task<IActionResult> GetTopDonors(
        [FromQuery] int count = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _unitOfWork.Pledges.GetTopDonors(count, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }

    // GET: api/pledges/analytics/top-campaigns (Top campaigns)
    [HttpGet("analytics/top-campaigns")]
    //[Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetTopCampaigns(
        [FromQuery] int count = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _unitOfWork.Pledges.GetTopCampaigns(count, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }

    // GET: api/pledges/analytics/campaign-summaries (Campaign transaction summaries)
    [HttpGet("analytics/campaign-summaries")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetCampaignTransactionSummaries(CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.Pledges.GetCampaignTransactionSummaries(cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }

    // GET: api/pledges/analytics/dashboard (Dashboard statistics)
    [HttpGet("analytics/dashboard")]
    //[Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetDashboardStatistics(CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.Pledges.GetDashboardStatistics(cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }
}
