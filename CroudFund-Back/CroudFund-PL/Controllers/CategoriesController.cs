using CroudFund_BLL.Abstractions;
using CroudFund_BLL.Interfaces;
using CroudFund_BLL.Reposatories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using CroudFund_BLL.Dtos.CategoryDto;

namespace CroudFund_PL.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CategoriesController(IUnitOfWork unitOfWork) : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork = unitOfWork;


    [HttpGet]
    public async Task<IActionResult> GetAllCategories(CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.Categories.GetAllCategories(cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }


    [HttpGet("{id}")]
    public async Task<IActionResult> GetCategoryById([FromRoute] int id, CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.Categories.GetCategoryById(id, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Value)
            : result.ToProblem();
    }


    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateCategory([FromBody] CategoryRequest request, CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.Categories.CreateCategory(request, cancellationToken);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetCategoryById), new { id = result.Value.Id }, result.Value)
            : result.ToProblem();
    }


    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateCategory(
            [FromRoute] int id,
            [FromBody] CategoryRequest request,
            CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.Categories.UpdateCategory(id, request, cancellationToken);
        return result.IsSuccess
            ? Ok(new { message = "Category updated successfully" })
            : result.ToProblem();
    }


    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteCategory([FromRoute] int id, CancellationToken cancellationToken)
    {
        var result = await _unitOfWork.Categories.DeleteCategory(id, cancellationToken);
        return result.IsSuccess
            ? Ok(new { message = "Category deleted successfully" })
            : result.ToProblem();
    }
}
