using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using CroudFund_BLL.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Abstractions
{
    public static class ResultExtensions
    {
        public static ObjectResult ToProblem(this Result result)
        {
            if (result.IsSuccess)
                throw new InvalidOperationException("cannot convert success result to problem");

            var problem = Results.Problem(statusCode: result.Error.StatusCode);

            var problemDetails = problem.GetType().GetProperty(nameof(ProblemDetails))!.GetValue(problem) as ProblemDetails;

            problemDetails!.Extensions = new Dictionary<string, object?>
            {
                {
                    "errors" , new []
                    {
                        result.Error.code,
                        result.Error.description
                    }
                }
            };

            return new ObjectResult(problemDetails);
        }
    }
}
