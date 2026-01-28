using CroudFund_BLL.Abstractions;
using CroudFund_BLL.Dtos.Common;
using CroudFund_BLL.Dtos.UserDto;
using CroudFund_BLL.Interfaces;
using CroudFund_BLL.Interfaces;
using CroudFund_BLL.Reposatories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
namespace CroudFund_PL.Controllers;

[Route("api/[controller]")]
[ApiController]
public class UsersController(IUnitOfWork unitOfWork) : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork = unitOfWork;

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMyDetalis(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var result = await _unitOfWork.Users.GetUserDetails(userId, cancellationToken);

        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }


    [HttpGet("{id}")]
    public async Task<IActionResult> GetuserDetalis([FromRoute] string id   ,CancellationToken cancellationToken)
    {

      var result = await _unitOfWork.Users.GetUserDetails(id, cancellationToken);

        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }

    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllUsers([FromQuery] RequestFilter request, CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.Users.GetAllUsers(request, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetAllActiveUsers([FromQuery] RequestFilter request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _unitOfWork.Users.GetAllActiveUsers(userId ,request, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }



    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromForm] UpdateUserRequest request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _unitOfWork.Users.UpdateUser(userId, request, cancellationToken);
        return result.IsSuccess
            ? Ok(new { message = "Profile updated successfully" })
            : result.ToProblem();
    }




    [HttpPut("{id}/changeactivity")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateUserActivity(
           [FromRoute] string id,
           CancellationToken cancellationToken)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _unitOfWork.Users.UpdateUserActivity(id, currentUserId, cancellationToken);
        return result.IsSuccess
            ? Ok(new { message = "User activity updated successfully" })
            : result.ToProblem();
    }



    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteUser([FromRoute] string id, CancellationToken cancellationToken)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var result = await _unitOfWork.Users.DeleteUser(id, currentUserId, cancellationToken);
        return result.IsSuccess
            ? Ok(new { message = "User deleted successfully" })
            : result.ToProblem();
    }

    [HttpPut("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangeUserPassword([FromBody] ChangeUserPasswordRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var result = await _unitOfWork.Users.ChangePasswordAsync(userId!, request);
        return result.IsSuccess
             ? Ok("Password updated successfully")
             : result.ToProblem();

    }

}
