using CroudFund_BLL.Dtos.CampaignDto;
using System;
using System.Collections.Generic;
using System.Text;

namespace CroudFund_BLL.Dtos.PledgeDto;

public record PledgeResponse
(
        int Id,
        string UserName,
        decimal Amount,
        DateTime TransactionDate,
        string Status ,
        CampaignResponse Campaign
);