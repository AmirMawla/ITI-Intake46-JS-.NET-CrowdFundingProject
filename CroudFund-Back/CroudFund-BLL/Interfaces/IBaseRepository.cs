using CroudFund_BLL.Abstractions;
using ServiceProvider_BLL.Dtos.SearchDto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace CroudFund_BLL.Interfaces
{
    public interface IBaseRepository<T> where T : class
    {
        Task<Result> AddAsync(T entity);
        Task<Result> UpdateAsync(T entity);
        Task<Result> RemoveAsync(int id);
        Task<Result<IEnumerable<T>>> GetAllAsync();
        Task<Result<T>> GetByIdAsync(int id);
        Task<Result<T>> FindByExpress(Expression<Func<T, bool>> Criteria);
        Task<Result<IEnumerable<T>>> FindAllByExpress(Expression<Func<T, bool>> Criteria);
        Task<Result<IEnumerable<T>>> GetAllWithIncludeAsync(params Expression<Func<T, object>>[] includes);
        Task<Result<T>> GetFirstOrDefaultWithIncludeAsync(Expression<Func<T, bool>> filter, params Expression<Func<T, object>>[] includes);
        Task<bool> AnyAsync(Expression<Func<T, bool>> filter);
    }
}
