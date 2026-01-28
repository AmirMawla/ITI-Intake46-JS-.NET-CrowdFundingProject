using Microsoft.AspNetCore.Http;
using CroudFund_BLL.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Errors
{
    public static class CheckOutErrors
    {
        public static readonly Error CheckOutFaild = new("Payment Failed", "Checkout transaction failed", StatusCodes.Status402PaymentRequired);

    }
}
