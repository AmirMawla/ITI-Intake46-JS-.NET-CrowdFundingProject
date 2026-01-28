using CroudFund_DAL.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace CroudFund_DAL.Entities;

public class Pledge
{
    public int Id { get; set; }

    public decimal Amount { get; set; }
    public DateTime CreatedAt {  get; set; } = DateTime.UtcNow;

    public string UserId { get; set; } = string.Empty;
    public int CampaignId { get; set; }

    public virtual Campaign Campaign { get; set; } = default!;
    public virtual ApplicationUser User { get; set; } = default!;
    public virtual Payment Payment { get; set; } = default!;

}
