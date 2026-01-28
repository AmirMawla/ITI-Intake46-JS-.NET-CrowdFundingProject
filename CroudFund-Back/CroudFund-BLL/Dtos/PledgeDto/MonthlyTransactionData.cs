using System;
using System.Collections.Generic;
using System.Text;

namespace CroudFund_BLL.Dtos.PledgeDto;

public record MonthlyTransactionData(
        int Year,
        int Month,
        string MonthName,
        decimal TotalAmount,
        int TotalCount
    );