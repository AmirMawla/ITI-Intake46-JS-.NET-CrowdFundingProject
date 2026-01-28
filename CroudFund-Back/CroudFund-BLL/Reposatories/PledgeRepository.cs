using CroudFund_BLL.Abstractions;
using CroudFund_BLL.Dtos.CampaignDto;
using CroudFund_BLL.Dtos.Common;
using CroudFund_BLL.Dtos.PledgeDto;
using CroudFund_BLL.Errors;
using CroudFund_BLL.Interfaces;
using CroudFund_DAL.Data;
using CroudFund_DAL.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Stripe;
using Stripe.Climate;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;
using System.Linq.Dynamic.Core;

namespace CroudFund_BLL.Reposatories;

public class PledgeRepository(AppDbContext context) : BaseRepository<Pledge>(context), IPledgeRepository
{
    private readonly AppDbContext _context = context;

    public async Task<Result<PledgeResponse>> AddPledgeAsync(string userId, int CampaignId, PledgeRequest request, CancellationToken cancellationToken = default)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {

            // Load required navigation props used below (User, Category)
            var campaign = await _context.Campaigns!
                .Include(c => c.User)
                .Include(c => c.Category)
                .FirstOrDefaultAsync(c => c.Id == CampaignId, cancellationToken);

            if (campaign == null)
                return Result.Failure<PledgeResponse>(CampaignErrors.NotFound);

            var totalAmount = request.Amount;

            // Create Stripe payment intent
            var stripeAmount = Convert.ToInt64(totalAmount * 100); // Convert to piasters (EGP subunits)

            var paymentIntentService = new PaymentIntentService();
            PaymentIntent paymentIntent;
            try
            {
                // For card-only flows, be explicit and avoid redirect requirements.
                // This works cleanly with test PaymentMethod IDs created from tokens like "tok_visa".
                paymentIntent = await paymentIntentService.CreateAsync(new PaymentIntentCreateOptions
                {
                    Amount = stripeAmount,
                    // UI uses "$" amounts; use USD to match the frontend.
                    // Using "egp" was making $12 be treated as 12 EGP (~$0.21), below Stripe minimum.
                    Currency = "usd",
                    PaymentMethod = request.PaymentMethodId,
                    PaymentMethodTypes = new List<string> { "card" },
                    Confirm = true
                }, cancellationToken: cancellationToken);
            }
            catch (StripeException ex)
            {
                try { await transaction.RollbackAsync(cancellationToken); } catch { /* ignore double-rollback */ }
                return Result.Failure<PledgeResponse>(
                    new Error("StripeError", ex.Message, StatusCodes.Status400BadRequest)
                );
            }

            var paymentMethodService = new PaymentMethodService();
            var paymentMethod = await paymentMethodService.GetAsync(
                paymentIntent.PaymentMethodId,  // Get ID from PaymentIntent
                cancellationToken: cancellationToken
            );

            // Format payment method description
            var paymentMethodDescription = paymentMethod?.Card != null
                ? $"{paymentMethod.Card.Brand}"
                : "Card payment";

            if (paymentIntent.Status != "succeeded")
            {
                return Result.Failure<PledgeResponse>(PledgeErrors.PaymentProcessingFailed);
            }


            var Pledge = new Pledge
            {
                Amount = totalAmount,
                CreatedAt = DateTime.UtcNow,
                UserId = userId,
                CampaignId = CampaignId
            };

            _context.Pledges!.Add(Pledge);
            await _context.SaveChangesAsync(cancellationToken);

            var payment = new Payment
            {
                
                Status = paymentIntent.Status == "succeeded"
                ? PaymentStatus.Success
                : PaymentStatus.Failed,
                PaidAt = DateTime.UtcNow,
                PaymentMethod = paymentMethodDescription,
                PledgeId = Pledge.Id
                
            };

            _context.Payments!.Add(payment);
            await _context.SaveChangesAsync(cancellationToken);

            // Load user name safely (Pledge.User isn't loaded here)
            var pledgerName = await _context.Users
                .Where(u => u.Id == userId)
                .Select(u => u.FullName)
                .FirstOrDefaultAsync(cancellationToken) ?? "Unknown";

            var result = new PledgeResponse
            (
                Pledge.Id,
                pledgerName,
                 Pledge.Amount,
                 Pledge.CreatedAt,
                payment.Status.ToString(),
                new CampaignResponse(
                    CampaignId,
                    campaign.Title,
                    campaign.Description,
                    campaign.GoalAmount,
                    campaign.Deadline,
                    campaign.Image,
                    campaign.IsApproved,
                    campaign.CreatedAt,
                    campaign.UserId,
                    campaign.User?.UserName ?? campaign.User?.FullName ?? "Unknown",
                    campaign.CategoryId,
                    campaign.Category?.Name ?? "Unknown",
                    await _context.Pledges!
                        .Where(p => p.CampaignId == campaign.Id && p.Payment.Status == PaymentStatus.Success)
                        .SumAsync(p => p.Amount, cancellationToken),
                    await _context.Pledges!
                        .Where(p => p.CampaignId == campaign.Id && p.Payment.Status == PaymentStatus.Success)
                        .Select(p => p.UserId)
                        .Distinct()
                        .CountAsync(cancellationToken)
                    )
            );  

            // Commit only after all reads/building succeeded (prevents rollback-after-commit errors)
            await transaction.CommitAsync(cancellationToken);
            return Result.Success(result);
        }
        catch (StripeException ex)
        {
            try { await transaction.RollbackAsync(cancellationToken); } catch { /* ignore double-rollback */ }
            return Result.Failure<PledgeResponse>(
                new Error("StripeError", ex.Message, StatusCodes.Status400BadRequest)
            );
        }
        catch
        {
            try { await transaction.RollbackAsync(cancellationToken); } catch { /* ignore double-rollback */ }
            return Result.Failure<PledgeResponse>(PledgeErrors.pledgeCreationFaild);
        }
    }



    public async Task<Result<PledgeResponse>> GetPledgeAsync(int id,  string userId,bool IsAdmin, CancellationToken cancellationToken = default)
    {
      
           var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        var Pledge = await _context.Pledges!
                .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

            if (Pledge == null)
                return Result.Failure<PledgeResponse>(PledgeErrors.pledgeNotFound);

        if ((user == null || user.Id != Pledge.UserId ) && !IsAdmin)
        {
            return Result.Failure<PledgeResponse>(PledgeErrors.Unauthorized);
        }



        var result = new PledgeResponse
            (
                Pledge.Id,
                Pledge.User.FullName,
                 Pledge.Amount,
                 Pledge.CreatedAt,
               Pledge.Payment.Status.ToString(),
                new CampaignResponse(
                    Pledge.CampaignId,
                   Pledge.Campaign.Title,
                    Pledge.Campaign.Description,
                    Pledge.Campaign.GoalAmount,
                    Pledge.Campaign.Deadline,
                    Pledge.Campaign.Image,
                    Pledge.Campaign.IsApproved,
                    Pledge.Campaign.CreatedAt,
                    Pledge.Campaign.UserId,
                    Pledge.Campaign.User.FullName,
                   Pledge.Campaign.CategoryId,
                    Pledge.Campaign.Category.Name,
                    await _context.Pledges!
                        .Where(p => p.CampaignId == Pledge.CampaignId && p.Payment.Status == PaymentStatus.Success)
                        .SumAsync(p => p.Amount, cancellationToken),
                    await _context.Pledges!
                        .Where(p => p.CampaignId == Pledge.CampaignId && p.Payment.Status == PaymentStatus.Success)
                        .Select(p => p.UserId)
                        .Distinct()
                        .CountAsync(cancellationToken)
                    )
            );
            return Result.Success(result);
      
    }



    // User's donations (money they gave to campaigns)
    public async Task<Result<PaginatedList<PledgeResponse>>> GetMyDonations(string userId, RequestFilter request, CancellationToken cancellationToken = default)
    {
        var query = _context.Pledges
            .Where(p => p.UserId == userId)
            .AsNoTracking();

        // Apply payment status filter
        if (request.Statuses != null && request.Statuses.Any())
        {
            var statusEnums = request.Statuses
                .Select(s => Enum.Parse<PaymentStatus>(s, true))
                .ToList();
            query = query.Where(p => statusEnums.Contains(p.Payment.Status));
        }

        // Apply date filter
        if (request.DateFilter.HasValue)
        {
            var filterDate = request.DateFilter.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(p => p.CreatedAt.Date == filterDate.Date);
        }

        // Apply sorting
        if (!string.IsNullOrEmpty(request.SortColumn))
        {
            query = query.OrderBy($"{request.SortColumn} {request.SortDirection ?? "asc"}");
        }
        else
        {
            query = query.OrderByDescending(p => p.CreatedAt);
        }

        // Project to response
        var source = query.Select(p => new PledgeResponse(
            p.Id,
            p.User.FullName,
            p.Amount,
            p.CreatedAt,
            p.Payment.Status.ToString(),
            new CampaignResponse(
                p.CampaignId,
                p.Campaign.Title,
                p.Campaign.Description,
                p.Campaign.GoalAmount,
                p.Campaign.Deadline,
                p.Campaign.Image,
                p.Campaign.IsApproved,
                p.Campaign.CreatedAt,
                p.Campaign.UserId,
                p.Campaign.User.FullName,
                p.Campaign.CategoryId,
                p.Campaign.Category.Name,
                _context.Pledges
                    .Where(pl => pl.CampaignId == p.CampaignId && pl.Payment.Status == PaymentStatus.Success)
                    .Sum(pl => (decimal?)pl.Amount) ?? 0,
                _context.Pledges
                    .Where(pl => pl.CampaignId == p.CampaignId && pl.Payment.Status == PaymentStatus.Success)
                    .Select(pl => pl.UserId)
                    .Distinct()
                    .Count()
            )
        ));

        var pledges = await PaginatedList<PledgeResponse>.CreateAsync(
            source,
            request.PageNumer,
            request.PageSize,
            cancellationToken
        );

        if (pledges.Items.Count == 0)
            return Result.Failure<PaginatedList<PledgeResponse>>(PledgeErrors.NoPledgesFound);

        return Result.Success(pledges);
    }

    // User's collections (money collected from their campaigns)
    public async Task<Result<PaginatedList<PledgeResponse>>> GetMyCollections(string userId, RequestFilter request, CancellationToken cancellationToken = default)
    {
        var query = _context.Pledges
            .Where(p => p.Campaign.UserId == userId)
            .AsNoTracking();

        // Apply payment status filter
        if (request.Statuses != null && request.Statuses.Any())
        {
            var statusEnums = request.Statuses
                .Select(s => Enum.Parse<PaymentStatus>(s, true))
                .ToList();
            query = query.Where(p => statusEnums.Contains(p.Payment.Status));
        }

        // Apply date filter
        if (request.DateFilter.HasValue)
        {
            var filterDate = request.DateFilter.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(p => p.CreatedAt.Date == filterDate.Date);
        }

        // Apply sorting
        if (!string.IsNullOrEmpty(request.SortColumn))
        {
            query = query.OrderBy($"{request.SortColumn} {request.SortDirection ?? "asc"}");
        }
        else
        {
            query = query.OrderByDescending(p => p.CreatedAt);
        }

        // Project to response
        var source = query.Select(p => new PledgeResponse(
            p.Id,
            p.User.FullName,
            p.Amount,
            p.CreatedAt,
            p.Payment.Status.ToString(),
            new CampaignResponse(
                p.CampaignId,
                p.Campaign.Title,
                p.Campaign.Description,
                p.Campaign.GoalAmount,
                p.Campaign.Deadline,
                p.Campaign.Image,
                p.Campaign.IsApproved,
                p.Campaign.CreatedAt,
                p.Campaign.UserId,
                p.Campaign.User.FullName,
                p.Campaign.CategoryId,
                p.Campaign.Category.Name,
                _context.Pledges
                    .Where(pl => pl.CampaignId == p.CampaignId && pl.Payment.Status == PaymentStatus.Success)
                    .Sum(pl => (decimal?)pl.Amount) ?? 0,
                _context.Pledges
                    .Where(pl => pl.CampaignId == p.CampaignId && pl.Payment.Status == PaymentStatus.Success)
                    .Select(pl => pl.UserId)
                    .Distinct()
                    .Count()
            )
        ));

        var pledges = await PaginatedList<PledgeResponse>.CreateAsync(
            source,
            request.PageNumer,
            request.PageSize,
            cancellationToken
        );

        if (pledges.Items.Count == 0)
            return Result.Failure<PaginatedList<PledgeResponse>>(PledgeErrors.NoPledgesFound);

        return Result.Success(pledges);
    }

    // User's transaction summary
    public async Task<Result<UserTransactionSummary>> GetMyTransactionSummary(string userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
            return Result.Failure<UserTransactionSummary>(UserErrors.NotFound);

        // Donations (money user gave)
        var donations = await _context.Pledges
            .Where(p => p.UserId == userId && p.Payment.Status == PaymentStatus.Success)
            .GroupBy(p => 1)
            .Select(g => new
            {
                TotalAmount = g.Sum(p => p.Amount),
                Count = g.Count(),
                LastDate = g.Max(p => (DateTime?)p.CreatedAt)
            })
            .FirstOrDefaultAsync(cancellationToken);

        // Collections (money collected from user's campaigns)
        var collections = await _context.Pledges
            .Where(p => p.Campaign.UserId == userId && p.Payment.Status == PaymentStatus.Success)
            .GroupBy(p => 1)
            .Select(g => new
            {
                TotalAmount = g.Sum(p => p.Amount),
                Count = g.Count(),
                LastDate = g.Max(p => (DateTime?)p.CreatedAt)
            })
            .FirstOrDefaultAsync(cancellationToken);

        var summary = new UserTransactionSummary(
            userId,
            user.FullName,
            donations?.TotalAmount ?? 0,
            donations?.Count ?? 0,
            collections?.TotalAmount ?? 0,
            collections?.Count ?? 0,
            donations?.LastDate,
            collections?.LastDate
        );

        return Result.Success(summary);
    }

    // User dashboard statistics (for creator dashboard)
    public async Task<Result<UserDashboardStatistics>> GetUserDashboardStatistics(string userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
            return Result.Failure<UserDashboardStatistics>(UserErrors.NotFound);

        var now = DateTime.UtcNow;
        var thisMonthStart = new DateTime(now.Year, now.Month, 1);
        var lastMonthStart = thisMonthStart.AddMonths(-1);
        var lastMonthEnd = thisMonthStart.AddDays(-1);

        // Base summary values (donations & collections)
        var summaryResult = await GetMyTransactionSummary(userId, cancellationToken);
        if (!summaryResult.IsSuccess)
            return Result.Failure<UserDashboardStatistics>(summaryResult.Error);

        var summary = summaryResult.Value;

        // Campaign success data
        var campaignStats = await _context.Campaigns
            .Where(c => c.UserId == userId)
            .Select(c => new
            {
                c.Id,
                c.GoalAmount,
                TotalRaised = _context.Pledges
                    .Where(p => p.CampaignId == c.Id && p.Payment.Status == PaymentStatus.Success)
                    .Sum(p => (decimal?)p.Amount) ?? 0
            })
            .ToListAsync(cancellationToken);

        var totalCampaigns = campaignStats.Count;
        var successfulCampaigns = campaignStats.Count(c => c.GoalAmount > 0 && c.TotalRaised >= c.GoalAmount);
        var successRate = totalCampaigns > 0
            ? (decimal)successfulCampaigns / totalCampaigns * 100
            : 0;

        // Monthly collected (from creator's campaigns)
        var lastMonthCollected = await _context.Pledges
            .Where(p =>
                p.Campaign.UserId == userId &&
                p.Payment.Status == PaymentStatus.Success &&
                p.CreatedAt >= lastMonthStart &&
                p.CreatedAt <= lastMonthEnd)
            .SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0;

        var thisMonthCollected = await _context.Pledges
            .Where(p =>
                p.Campaign.UserId == userId &&
                p.Payment.Status == PaymentStatus.Success &&
                p.CreatedAt >= thisMonthStart)
            .SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0;

        // Monthly donated (money user gave)
        var lastMonthDonated = await _context.Pledges
            .Where(p =>
                p.UserId == userId &&
                p.Payment.Status == PaymentStatus.Success &&
                p.CreatedAt >= lastMonthStart &&
                p.CreatedAt <= lastMonthEnd)
            .SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0;

        var thisMonthDonated = await _context.Pledges
            .Where(p =>
                p.UserId == userId &&
                p.Payment.Status == PaymentStatus.Success &&
                p.CreatedAt >= thisMonthStart)
            .SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0;

        decimal CalculateGrowth(decimal previous, decimal current)
        {
            if (previous > 0)
                return (current - previous) / previous * 100;

            return current > 0 ? 100 : 0;
        }

        var collectedGrowth = CalculateGrowth(lastMonthCollected, thisMonthCollected);
        var donatedGrowth = CalculateGrowth(lastMonthDonated, thisMonthDonated);

        var dashboard = new UserDashboardStatistics(
            userId,
            summary.UserName,
            summary.TotalCollected,
            summary.TotalCollectionCount,
            summary.TotalDonated,
            summary.TotalDonationCount,
            totalCampaigns,
            successfulCampaigns,
            successRate,
            thisMonthCollected,
            lastMonthCollected,
            collectedGrowth,
            thisMonthDonated,
            lastMonthDonated,
            donatedGrowth
        );

        return Result.Success(dashboard);
    }

    // User monthly financial performance (for chart)
    public async Task<Result<List<UserMonthlyFinancialPerformance>>> GetUserMonthlyFinancialPerformance(string userId, CancellationToken cancellationToken = default)
    {
        var userExists = await _context.Users.AnyAsync(u => u.Id == userId, cancellationToken);
        if (!userExists)
            return Result.Failure<List<UserMonthlyFinancialPerformance>>(UserErrors.NotFound);

        var query = _context.Pledges
            .Where(p =>
                p.Payment.Status == PaymentStatus.Success &&
                (p.UserId == userId || p.Campaign.UserId == userId));

        var monthlyRaw = await query
            .GroupBy(p => new { p.CreatedAt.Year, p.CreatedAt.Month })
            .Select(g => new
            {
                g.Key.Year,
                g.Key.Month,
                CollectedAmount = g.Where(p => p.Campaign.UserId == userId).Sum(p => (decimal?)p.Amount) ?? 0,
                CollectedCount = g.Count(p => p.Campaign.UserId == userId),
                DonatedAmount = g.Where(p => p.UserId == userId).Sum(p => (decimal?)p.Amount) ?? 0,
                DonatedCount = g.Count(p => p.UserId == userId)
            })
            .ToListAsync(cancellationToken);

        // Order by total activity (most volume & transactions first)
        var ordered = monthlyRaw
            .OrderByDescending(m => m.CollectedAmount + m.DonatedAmount)
            .ThenByDescending(m => m.CollectedCount + m.DonatedCount)
            .ThenByDescending(m => m.Year)
            .ThenByDescending(m => m.Month)
            .ToList();

        var result = ordered
            .Select(m => new UserMonthlyFinancialPerformance(
                m.Year,
                m.Month,
                CultureInfo.CurrentCulture.DateTimeFormat.GetAbbreviatedMonthName(m.Month).ToUpperInvariant(),
                m.CollectedAmount,
                m.CollectedCount,
                m.DonatedAmount,
                m.DonatedCount
            ))
            .ToList();

        return Result.Success(result);
    }

    // Admin: Get all pledges
    public async Task<Result<PaginatedList<PledgeResponse>>> GetAllPledges(RequestFilter request, CancellationToken cancellationToken = default)
    {
        var query = _context.Pledges.AsNoTracking();

        // Apply payment status filter
        if (request.Statuses != null && request.Statuses.Any())
        {
            var statusEnums = request.Statuses
                .Select(s => Enum.Parse<PaymentStatus>(s, true))
                .ToList();
            query = query.Where(p => statusEnums.Contains(p.Payment.Status));
        }

        // Apply payment method filter
        if (request.PaymentMethods != null && request.PaymentMethods.Any())
        {
            query = query.Where(p => request.PaymentMethods.Contains(p.Payment.PaymentMethod));
        }

        // Apply search filter
        if (!string.IsNullOrEmpty(request.SearchValue))
        {
            var searchTerm = $"%{request.SearchValue.ToLower()}%";
            query = query.Where(p =>
                EF.Functions.Like(p.User.FullName.ToLower(), searchTerm) ||
                EF.Functions.Like(p.Campaign.Title.ToLower(), searchTerm)
            );
        }

        // Apply date filter
        if (request.DateFilter.HasValue)
        {
            var filterDate = request.DateFilter.Value.ToDateTime(TimeOnly.MinValue);
            query = query.Where(p => p.CreatedAt.Date == filterDate.Date);
        }

        // Apply sorting
        if (!string.IsNullOrEmpty(request.SortColumn))
        {
            query = query.OrderBy($"{request.SortColumn} {request.SortDirection ?? "asc"}");
        }
        else
        {
            query = query.OrderByDescending(p => p.CreatedAt);
        }

        // Project to response
        var source = query.Select(p => new PledgeResponse(
            p.Id,
            p.User.FullName,
            p.Amount,
            p.CreatedAt,
            p.Payment.Status.ToString(),
            new CampaignResponse(
                p.CampaignId,
                p.Campaign.Title,
                p.Campaign.Description,
                p.Campaign.GoalAmount,
                p.Campaign.Deadline,
                p.Campaign.Image,
                p.Campaign.IsApproved,
                p.Campaign.CreatedAt,
                p.Campaign.UserId,
                p.Campaign.User.FullName,
                p.Campaign.CategoryId,
                p.Campaign.Category.Name,
                _context.Pledges
                    .Where(pl => pl.CampaignId == p.CampaignId && pl.Payment.Status == PaymentStatus.Success)
                    .Sum(pl => (decimal?)pl.Amount) ?? 0,
                _context.Pledges
                    .Where(pl => pl.CampaignId == p.CampaignId && pl.Payment.Status == PaymentStatus.Success)
                    .Select(pl => pl.UserId)
                    .Distinct()
                    .Count()
            )
        ));

        var pledges = await PaginatedList<PledgeResponse>.CreateAsync(
            source,
            request.PageNumer,
            request.PageSize,
            cancellationToken
        );

        if (pledges.Items.Count == 0)
            return Result.Failure<PaginatedList<PledgeResponse>>(PledgeErrors.NoPledgesFound);

        return Result.Success(pledges);
    }

    // Admin: Get pledges by campaign
    public async Task<Result<PaginatedList<PledgeResponse>>> GetPledgesByCampaign(int campaignId, RequestFilter request, CancellationToken cancellationToken = default)
    {
        var campaignExists = await _context.Campaigns.AnyAsync(c => c.Id == campaignId, cancellationToken);
        if (!campaignExists)
            return Result.Failure<PaginatedList<PledgeResponse>>(CampaignErrors.NotFound);

        var query = _context.Pledges
            .Where(p => p.CampaignId == campaignId)
            .AsNoTracking();

        // Apply filters and sorting (same as GetAllPledges)
        if (request.Statuses != null && request.Statuses.Any())
        {
            var statusEnums = request.Statuses.Select(s => Enum.Parse<PaymentStatus>(s, true)).ToList();
            query = query.Where(p => statusEnums.Contains(p.Payment.Status));
        }

        if (!string.IsNullOrEmpty(request.SortColumn))
        {
            query = query.OrderBy($"{request.SortColumn} {request.SortDirection ?? "asc"}");
        }
        else
        {
            query = query.OrderByDescending(p => p.CreatedAt);
        }

        var source = query.Select(p => new PledgeResponse(
            p.Id,
            p.User.FullName,
            p.Amount,
            p.CreatedAt,
            p.Payment.Status.ToString(),
            new CampaignResponse(
                p.CampaignId,
                p.Campaign.Title,
                p.Campaign.Description,
                p.Campaign.GoalAmount,
                p.Campaign.Deadline,
                p.Campaign.Image,
                p.Campaign.IsApproved,
                p.Campaign.CreatedAt,
                p.Campaign.UserId,
                p.Campaign.User.FullName,
                p.Campaign.CategoryId,
                p.Campaign.Category.Name,
                _context.Pledges
                    .Where(pl => pl.CampaignId == p.CampaignId && pl.Payment.Status == PaymentStatus.Success)
                    .Sum(pl => (decimal?)pl.Amount) ?? 0,
                _context.Pledges
                    .Where(pl => pl.CampaignId == p.CampaignId && pl.Payment.Status == PaymentStatus.Success)
                    .Select(pl => pl.UserId)
                    .Distinct()
                    .Count()
            )
        ));

        var pledges = await PaginatedList<PledgeResponse>.CreateAsync(source, request.PageNumer, request.PageSize, cancellationToken);

        if (pledges.Items.Count == 0)
            return Result.Failure<PaginatedList<PledgeResponse>>(PledgeErrors.NoPledgesFound);

        return Result.Success(pledges);
    }

    // Admin: Get pledges by user
    public async Task<Result<PaginatedList<PledgeResponse>>> GetPledgesByUser(string userId, RequestFilter request, CancellationToken cancellationToken = default)
    {
        var userExists = await _context.Users.AnyAsync(u => u.Id == userId, cancellationToken);
        if (!userExists)
            return Result.Failure<PaginatedList<PledgeResponse>>(UserErrors.NotFound);

        return await GetMyDonations(userId, request, cancellationToken);
    }

    // Admin: Get user transaction summary
    public async Task<Result<UserTransactionSummary>> GetUserTransactionSummary(string userId, CancellationToken cancellationToken = default)
    {
        return await GetMyTransactionSummary(userId, cancellationToken);
    }

    // Analytics: Transaction statistics
    public async Task<Result<TransactionStatistics>> GetTransactionStatistics(DateTime? startDate, DateTime? endDate, CancellationToken cancellationToken = default)
    {
        var query = _context.Pledges.AsQueryable();

        if (startDate.HasValue)
            query = query.Where(p => p.CreatedAt >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(p => p.CreatedAt <= endDate.Value);

        var stats = await query
            .GroupBy(p => 1)
            .Select(g => new
            {
                TotalAmount = g.Sum(p => p.Amount),
                TotalCount = g.Count(),
                SuccessfulAmount = g.Where(p => p.Payment.Status == PaymentStatus.Success).Sum(p => (decimal?)p.Amount) ?? 0,
                SuccessfulCount = g.Count(p => p.Payment.Status == PaymentStatus.Success),
                FailedAmount = g.Where(p => p.Payment.Status == PaymentStatus.Failed).Sum(p => (decimal?)p.Amount) ?? 0,
                FailedCount = g.Count(p => p.Payment.Status == PaymentStatus.Failed),
                PendingAmount = g.Where(p => p.Payment.Status == PaymentStatus.Pending).Sum(p => (decimal?)p.Amount) ?? 0,
                PendingCount = g.Count(p => p.Payment.Status == PaymentStatus.Pending)
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (stats is null)
            return Result.Failure<TransactionStatistics>(PledgeErrors.NoTransactionsFound);

        // Payment method breakdown
        var paymentBreakdown = await query
            .Where(p => p.Payment.Status == PaymentStatus.Success)
            .GroupBy(p => p.Payment.PaymentMethod)
            .Select(g => new { Method = g.Key, Amount = g.Sum(p => p.Amount) })
            .ToDictionaryAsync(x => x.Method, x => x.Amount, cancellationToken);

        // Monthly data - fix: get raw data then format month names in memory
        var monthlyRawData = await query
            .Where(p => p.Payment.Status == PaymentStatus.Success)
            .GroupBy(p => new { p.CreatedAt.Year, p.CreatedAt.Month })
            .Select(g => new
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                TotalAmount = g.Sum(p => p.Amount),
                TotalCount = g.Count()
            })
            .OrderByDescending(m => m.Year)
            .ThenByDescending(m => m.Month)
            .Take(12)
            .ToListAsync(cancellationToken);

        // Format month names in memory after query execution
        var monthlyData = monthlyRawData
            .Select(m => new MonthlyTransactionData(
                m.Year,
                m.Month,
                CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(m.Month),
                m.TotalAmount,
                m.TotalCount
            ))
            .ToList();

        var result = new TransactionStatistics(
            stats.TotalAmount,
            stats.TotalCount,
            stats.SuccessfulAmount,
            stats.SuccessfulCount,
            stats.FailedAmount,
            stats.FailedCount,
            stats.PendingAmount,
            stats.PendingCount,
            stats.TotalCount > 0 ? stats.TotalAmount / stats.TotalCount : 0,
            paymentBreakdown,
            monthlyData
        );

        return Result.Success(result);
    }

    // Analytics: Top donors
    public async Task<Result<List<TopDonor>>> GetTopDonors(int count, CancellationToken cancellationToken = default)
    {
        var topDonors = await _context.Pledges
               .Where(p => p.Payment.Status == PaymentStatus.Success)
               .GroupBy(p => new { p.UserId, p.User.FullName , p.User.ProfileImage })
               .Select(g => new
               {
                   UserId = g.Key.UserId,
                   UserName = g.Key.FullName,
                   UserImage = g.Key.ProfileImage,
                   TotalDonated = g.Sum(p => p.Amount),
                   DonationCount = g.Count()
               })
               .OrderByDescending(d => d.TotalDonated)
               .Take(count)
               .ToListAsync(cancellationToken);

        var result = topDonors
            .Select(d => new TopDonor(d.UserId, d.UserName, d.UserImage, d.TotalDonated, d.DonationCount))
            .ToList();

        return Result.Success(result);
    }

    // Analytics: Top campaigns
    public async Task<Result<List<TopCampaign>>> GetTopCampaigns(int count, CancellationToken cancellationToken = default)
    {
        var topCampaigns = await _context.Campaigns
                .Select(c => new
                {
                    CampaignId = c.Id,
                    CampaignTitle = c.Title,
                    Deadline = c.Deadline,
                    CategoryName = c.Category.Name,
                    CampaignDescription = c.Description,
                    GoalAmount = c.GoalAmount,
                    CampaignImage = c.Image,
                    UserId = c.UserId,
                    UserName = c.User.FullName,
                    TotalCollected = _context.Pledges
                        .Where(p => p.CampaignId == c.Id && p.Payment.Status == PaymentStatus.Success)
                        .Sum(p => (decimal?)p.Amount) ?? 0,
                    DonorCount = _context.Pledges
                        .Where(p => p.CampaignId == c.Id && p.Payment.Status == PaymentStatus.Success)
                        .Select(p => p.UserId)
                        .Distinct()
                        .Count()
                })
                .ToListAsync(cancellationToken);

        // Calculate completion percentage and sort in memory
        var result = topCampaigns
            .Select(x => new TopCampaign(
                x.CampaignId,
                x.CampaignTitle,
                x.CampaignDescription,
                x.GoalAmount,
                x.CampaignImage,
                x.UserId,
                x.UserName,
                x.CategoryName,
                x.TotalCollected,
                x.DonorCount,
                x.GoalAmount > 0 ? (x.TotalCollected / x.GoalAmount) * 100 : 0,
                x.Deadline
            ))
            .OrderByDescending(c => c.TotalCollected)
            .Take(count)
            .ToList();

        return Result.Success(result);
    }

    // Analytics: Campaign transaction summaries
    public async Task<Result<List<CampaignTransactionSummary>>> GetCampaignTransactionSummaries(CancellationToken cancellationToken = default)
    {
        var summaries = await _context.Campaigns
                .Select(c => new
                {
                    CampaignId = c.Id,
                    CampaignTitle = c.Title,
                    GoalAmount = c.GoalAmount,
                    TotalCollected = _context.Pledges
                        .Where(p => p.CampaignId == c.Id && p.Payment.Status == PaymentStatus.Success)
                        .Sum(p => (decimal?)p.Amount) ?? 0,
                    DonorCount = _context.Pledges
                        .Where(p => p.CampaignId == c.Id && p.Payment.Status == PaymentStatus.Success)
                        .Select(p => p.UserId)
                        .Distinct()
                        .Count(),
                    LastDonation = _context.Pledges
                        .Where(p => p.CampaignId == c.Id && p.Payment.Status == PaymentStatus.Success)
                        .Max(p => (DateTime?)p.CreatedAt)
                })
                .ToListAsync(cancellationToken);

        // Calculate completion percentage and sort in memory
        var result = summaries
            .Select(x => new CampaignTransactionSummary(
                x.CampaignId,
                x.CampaignTitle,
                x.GoalAmount,
                x.TotalCollected,
                x.DonorCount,
                x.GoalAmount > 0 ? (x.TotalCollected / x.GoalAmount) * 100 : 0,
                x.LastDonation
            ))
            .OrderByDescending(s => s.TotalCollected)
            .ToList();

        return Result.Success(result);
    }


    // Analytics: Dashboard statistics
    public async Task<Result<DashboardStatistics>> GetDashboardStatistics(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var thisMonthStart = new DateTime(now.Year, now.Month, 1);
        var lastMonthStart = thisMonthStart.AddMonths(-1);

        var totalRevenue = await _context.Pledges
            .Where(p => p.Payment.Status == PaymentStatus.Success)
            .SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0;

        var totalTransactions = await _context.Pledges.CountAsync(cancellationToken);

        var totalCampaigns = await _context.Campaigns.CountAsync(cancellationToken);

        var activeCampaigns = await _context.Campaigns
            .Where(c => c.IsApproved && c.Deadline > now)
            .CountAsync(cancellationToken);

        var pendingCampaigns = await _context.Campaigns
            .Where(c => !c.IsApproved)
            .CountAsync(cancellationToken);

        var totalUsers = await _context.Users.CountAsync(cancellationToken);

        var activeDonors = await _context.Pledges
            .Where(p => p.Payment.Status == PaymentStatus.Success)
            .Select(p => p.UserId)
            .Distinct()
            .CountAsync(cancellationToken);

        var averageDonation = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

        var thisMonthRevenue = await _context.Pledges
            .Where(p => p.Payment.Status == PaymentStatus.Success && p.CreatedAt >= thisMonthStart)
            .SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0;

        var lastMonthRevenue = await _context.Pledges
            .Where(p => p.Payment.Status == PaymentStatus.Success
                && p.CreatedAt >= lastMonthStart
                && p.CreatedAt < thisMonthStart)
            .SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0;

        var revenueGrowth = lastMonthRevenue > 0
            ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : 0;

        // Donor activity growth (distinct donors per month)
        var thisMonthDonors = await _context.Pledges
            .Where(p => p.Payment.Status == PaymentStatus.Success && p.CreatedAt >= thisMonthStart)
            .Select(p => p.UserId)
            .Distinct()
            .CountAsync(cancellationToken);

        var lastMonthDonors = await _context.Pledges
            .Where(p => p.Payment.Status == PaymentStatus.Success
                        && p.CreatedAt >= lastMonthStart
                        && p.CreatedAt < thisMonthStart)
            .Select(p => p.UserId)
            .Distinct()
            .CountAsync(cancellationToken);

        var donorGrowth = lastMonthDonors > 0
            ? ((decimal)(thisMonthDonors - lastMonthDonors) / lastMonthDonors) * 100
            : 0;

        // Campaign creation growth (campaigns created per month)
        var thisMonthCampaigns = await _context.Campaigns
            .Where(c => c.CreatedAt >= thisMonthStart)
            .CountAsync(cancellationToken);

        var lastMonthCampaigns = await _context.Campaigns
            .Where(c => c.CreatedAt >= lastMonthStart && c.CreatedAt < thisMonthStart)
            .CountAsync(cancellationToken);

        var campaignsGrowth = lastMonthCampaigns > 0
            ? ((decimal)(thisMonthCampaigns - lastMonthCampaigns) / lastMonthCampaigns) * 100
            : 0;

        var stats = new DashboardStatistics(
            totalRevenue,
            totalTransactions,
            totalCampaigns,
            activeCampaigns,
            pendingCampaigns,
            totalUsers,
            activeDonors,
            averageDonation,
            thisMonthRevenue,
            lastMonthRevenue,
            revenueGrowth,
            donorGrowth,
            campaignsGrowth
        );

        return Result.Success(stats);
    }
}
