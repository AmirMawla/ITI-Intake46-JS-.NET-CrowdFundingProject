using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using CroudFund_BLL.Abstractions;
using CroudFund_BLL.Authentication;
using CroudFund_BLL.Dtos.AuthenticationDto;
using CroudFund_BLL.Dtos.UserDto;
using CroudFund_BLL.Interfaces;
using Stripe;
using System.Security.Claims;
using CroudFund_BLL.Interfaces;

namespace CroudFund_PL.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController(IAuthRepositry authRepositry) : ControllerBase
    {
        private readonly IAuthRepositry _authRepositry = authRepositry;


        [HttpPost("")]
        public async Task<IActionResult> LogIn([FromBody] LogInRequest request, CancellationToken cancellationToken)
        {
            var result = await _authRepositry.GetTokenAsync(request.Email, request.Password, cancellationToken);

            return result.IsSuccess ? Ok(result.Value) : result.ToProblem();
        }



        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request, CancellationToken cancellation)
        {
            var result = await _authRepositry.GetRefreshTokenAsync(request.Token, request.RefreshToken, cancellation);

            return result.IsSuccess ? Ok(result.Value) : result.ToProblem();
        }

        [HttpPut("revoke-refresh-token")]
        public async Task<IActionResult> RevokeRefresh([FromBody] RefreshTokenRequest request, CancellationToken cancellation)
        {
            var result = await _authRepositry.RevokeRefreshTokenAsync(request.Token, request.RefreshToken, cancellation);

            return result.IsSuccess ? Ok() : result.ToProblem();
        }


        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterationRequest request, CancellationToken cancellationToken)
        {

            Console.WriteLine($"EMAIL: '{request.Email}'");

            var result = await _authRepositry.RegisterAsync(request, cancellationToken);

            return result.IsSuccess ? Ok() : result.ToProblem();
        }


        [HttpPost("create-test-payment-method")]
        public async Task<IActionResult> CreateTestPaymentMethod([FromBody] TestTokenRequest request)
        {
            var pmOptions = new PaymentMethodCreateOptions
            {
                Type = "card",
                Card = new PaymentMethodCardOptions
                {
                    Token = request.TestToken // e.g. "tok_visa"
                },
            };

            var service = new PaymentMethodService();
            var paymentMethod = await service.CreateAsync(pmOptions);

            return Ok(new
            {
                PaymentMethodId = paymentMethod.Id,
                Brand = paymentMethod.Card.Brand,
                Last4 = paymentMethod.Card.Last4
            });
        }

        public record TestTokenRequest(string TestToken);

    }
}
