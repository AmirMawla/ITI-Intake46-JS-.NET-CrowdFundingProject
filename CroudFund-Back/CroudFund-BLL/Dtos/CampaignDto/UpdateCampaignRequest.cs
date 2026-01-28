using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;

namespace CroudFund_BLL.Dtos.CampaignDto;

public record UpdateCampaignRequest
(
    string Title ,
    string Description ,
    decimal GoalAmount ,
    DateTime Deadline ,
    IFormFile? Image ,
    int CategoryId 
);
