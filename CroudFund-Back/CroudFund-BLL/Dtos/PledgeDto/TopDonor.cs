using System;
using System.Collections.Generic;
using System.Text;

namespace CroudFund_BLL.Dtos.PledgeDto;

public record TopDonor(
        string UserId,
        string UserName,
        string UserImage,
        decimal TotalDonated,
        int DonationCount
    );
