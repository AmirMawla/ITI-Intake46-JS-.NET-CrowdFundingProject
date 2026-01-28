using CroudFund_BLL.Abstractions;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;

namespace CroudFund_BLL.Errors;

public static class PledgeErrors
{

    public static readonly Error pledgeNotFound = new("Not Found", "pledge does not exist", StatusCodes.Status404NotFound);
    public static readonly Error pledgeCreationFaild = new("Failure", "pledge creation failed", StatusCodes.Status400BadRequest);
    public static readonly Error UserNotpledgeOwner = new("NotAuthorized", "User is not the pledge owner.", StatusCodes.Status403Forbidden);
    public static readonly Error userNotAssociatedWithThisPledge = new("NotAuthorized", "Vendor is not associated with this order.", StatusCodes.Status403Forbidden);
    public static readonly Error PaymentProcessingFailed = new("Failure", "This payment hasn't been successeded.", StatusCodes.Status400BadRequest);
    public static readonly Error Unauthorized = new("Pledge.UnauthorizedAccess", "You do not have permission .", StatusCodes.Status403Forbidden);
    public static readonly Error NoPledgesFound = new("Pledge.NoPledgesFound", "No pledges found matching the criteria.", 404);
    public static readonly Error NoTransactionsFound = new("Pledge.NoTransactionsFound", "No transactions found.", 404);
}
