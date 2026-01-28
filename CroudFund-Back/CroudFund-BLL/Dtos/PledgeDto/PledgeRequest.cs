using System;
using System.Collections.Generic;
using System.Text;

namespace CroudFund_BLL.Dtos.PledgeDto;

public record PledgeRequest
(
    decimal Amount,
    string PaymentMethodId
);
