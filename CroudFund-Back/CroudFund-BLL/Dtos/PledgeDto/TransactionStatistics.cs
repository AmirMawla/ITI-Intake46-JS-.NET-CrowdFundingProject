using System;
using System.Collections.Generic;
using System.Text;

namespace CroudFund_BLL.Dtos.PledgeDto;

public record TransactionStatistics(
       decimal TotalAmount,
       int TotalCount,
       decimal SuccessfulAmount,
       int SuccessfulCount,
       decimal FailedAmount,
       int FailedCount,
       decimal PendingAmount,
       int PendingCount,
       decimal AverageTransactionAmount,
       Dictionary<string, decimal> PaymentMethodBreakdown,
       List<MonthlyTransactionData> MonthlyData
   );

