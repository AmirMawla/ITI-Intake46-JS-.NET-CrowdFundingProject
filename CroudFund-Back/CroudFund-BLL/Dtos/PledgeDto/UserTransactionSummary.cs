using System;
using System.Collections.Generic;
using System.Text;

namespace CroudFund_BLL.Dtos.PledgeDto;

public record UserTransactionSummary(
        string UserId,
        string UserName,
        decimal TotalDonated,
        int TotalDonationCount,
        decimal TotalCollected,
        int TotalCollectionCount,
        DateTime? LastDonationDate,
        DateTime? LastCollectionDate
    );
