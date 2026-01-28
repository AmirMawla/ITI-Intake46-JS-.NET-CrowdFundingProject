using CroudFund_BLL.Abstractions;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;


namespace CroudFund_BLL.Errors;

public static class CampaignErrors
{
    public static readonly Error NotFound = new( "Campaign.NotFound" , "The specified campaign was not found.",StatusCodes.Status404NotFound);
    public static readonly Error CreateFailed = new("Campaign.CreateFailed", "Failed to create campaign.", 400);
    public static readonly Error NoCampaignsFound = new("Campaign.NoCampaignsFound", "No campaigns found matching the criteria.", StatusCodes.Status404NotFound);
    public static readonly Error UpdateFailed = new("Campaign.UpdateFailed", "Failed to update campaign.", 400);
    public static readonly Error DeleteFailed = new("Campaign.DeleteFailed", "Failed to delete campaign.", 400);
    public static readonly Error UnauthorizedAccess = new("Campaign.UnauthorizedAccess", "You do not have permission to update this campaign.", StatusCodes.Status403Forbidden);
    public static readonly Error Unauthorized = new("Campaign.UnauthorizedAccess", "You do not have permission .", StatusCodes.Status403Forbidden);
    public static readonly Error CategoryNotFound = new("Campaign.CategoryNotFound", "The specified category was not found.", StatusCodes.Status404NotFound);
    public static readonly Error CannotDeleteWithPledges = new("Campaign.CannotDeleteWithPledges", "Cannot delete campaign that has pledges.", 400);
}
