using CroudFund_BLL.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using CroudFund_BLL.Abstractions;

namespace SeeviceProvider_PL.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchController(IUnitOfWork searchRepository) : ControllerBase
    {
        private readonly IUnitOfWork _searchRepository = searchRepository;

        [HttpGet]
        public async Task<IActionResult> GlobalSearch([FromQuery] string term, CancellationToken cancellationToken = default)
        {
            var result = await _searchRepository.Search.GlobalSearchAsync(term, 50, cancellationToken);

            return result.IsSuccess ? Ok(result.Value) : result.ToProblem();
        }
    }
}
