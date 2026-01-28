using System;

namespace CroudFund_BLL.Dtos.PledgeDto;

public record UserMonthlyFinancialPerformance(
        int Year,
        int Month,
        string MonthName,
        decimal CollectedAmount,
        int CollectedCount,
        decimal DonatedAmount,
        int DonatedCount
    );


