using CroudFund_DAL.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace CroudFund_DAL.Entities;

public class Campaign
{
    public int  Id { get; set; }
    public string Title {  get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal GoalAmount {  get; set; }
    public DateTime Deadline { get; set; }
    public string Image { get; set; } = "/images/campains/default.jpg";
    public bool IsApproved { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string UserId { get; set; } = string.Empty;
    public int CategoryId { get; set; }


    public virtual ApplicationUser User { get; set; } = default!;
    public virtual Category Category { get; set; } = default!;

    public virtual ICollection<Pledge> Pledges { get; set; } = [];
    public virtual ICollection<Review> Reviews { get; set; } = [];

}
