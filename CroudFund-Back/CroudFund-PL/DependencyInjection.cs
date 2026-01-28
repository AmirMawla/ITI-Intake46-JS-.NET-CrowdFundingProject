using FluentValidation;
using FluentValidation.AspNetCore;
using Mapster;
using MapsterMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using NotificationService.Models;
using SeeviceProvider_PL.Swagger;
using CroudFund_BLL.Abstractions;
using CroudFund_BLL.Authentication;
using CroudFund_BLL.Errors;
using CroudFund_BLL.Interfaces;
using CroudFund_BLL.Reposatories;
using CroudFund_DAL.Data;
using CroudFund_DAL.Entities;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Reflection;
using System.Text;
using ServiceProvider_BLL.Reposatories;

namespace SeeviceProvider_PL
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddDependency(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddControllers();

            // services.AddEndpointsApiExplorer();

            //services.AddSwaggerGen();


            //services.AddCors(options =>
            //        options.AddDefaultPolicy(builder =>
            //                builder.AllowAnyOrigin()
            //                       .AllowAnyMethod()
            //                       .AllowAnyHeader()

            //        )
            //);

            services.AddCors(options =>
                    options.AddDefaultPolicy(builder =>
                    builder
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials()
                    .SetIsOriginAllowed(_ => true) // للسماح بكل origins مع credentials
                    )
            );

            services
                .AddSwaggerServices()
                .AddMapsterConfiguration()
                .AddFluentValidationConfiguration()
                .AddAuthConfiguration(configuration);

            var connectionString = configuration.GetConnectionString("Default Connection") ??
             throw new InvalidOperationException("connection string 'Default Connection' not found.");

            services.AddDbContext<AppDbContext>(options =>
            options.UseLazyLoadingProxies().UseSqlServer(connectionString));



            services.AddScoped(typeof(IUnitOfWork), typeof(UnitOfWork));
            services.AddScoped<IAuthRepositry, AuthRepositry>();
            //services.AddScoped<IAnalyticsRepositry, AnalyticsRepositry>();
            //services.AddScoped<IMessageRepository, MessageRepository>();

            services.AddExceptionHandler<GlobalExeptionHandler>();
            services.AddProblemDetails();

            //services.AddMassTransit(x =>
            //{
            //    x.UsingRabbitMq((context, cfg) =>
            //    {
            //        cfg.Host(
            //            configuration["RabbitMQ:Host"],
            //            configuration["RabbitMQ:VirtualHost"],
            //            h =>
            //            {
            //                h.Username(configuration["RabbitMQ:Username"]!);
            //                h.Password(configuration["RabbitMQ:Password"]!);
            //            });

            //        cfg.Message<NotificationMessage>(c =>
            //        {
            //            c.SetEntityName("NotificationMessage");
            //        });

            //        cfg.ConfigureJsonSerializerOptions(options =>
            //        {
            //            options.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
            //            return options;
            //        });

            //        cfg.ConfigureEndpoints(context);
            //    });
            //});



            return services;
        }

        private static IServiceCollection AddSwaggerServices(this IServiceCollection services)
        {
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen();

            //services.AddTransient<IConfigureOptions<SwaggerGenOptions>, ConfigureSwaggerOptions>();

            return services;
        }

        private static IServiceCollection AddMapsterConfiguration(this IServiceCollection services)
        {
            var mappingConfig = TypeAdapterConfig.GlobalSettings;

            mappingConfig.Scan(AppDomain.CurrentDomain.GetAssemblies());

            services.AddSingleton<IMapper>(new Mapper(mappingConfig));

            return services;
        }

        private static IServiceCollection AddFluentValidationConfiguration(this IServiceCollection services)
        {
            services.AddFluentValidationAutoValidation();
            services.AddValidatorsFromAssemblies(AppDomain.CurrentDomain.GetAssemblies());

            return services;
        }

        private static IServiceCollection AddAuthConfiguration(this IServiceCollection services , IConfiguration configuration) 
        {
            services.AddSingleton<IJwtProvider, JwtProvider>();
            services.AddIdentity<ApplicationUser, IdentityRole>()
                .AddEntityFrameworkStores<AppDbContext>()
                .AddDefaultTokenProviders();

            services.AddOptions<JwtOptions>()
                .BindConfiguration(JwtOptions.SectionName)
                .ValidateDataAnnotations()
                .ValidateOnStart();

            var jwtSettings = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>();

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
           .AddJwtBearer(o =>
           {
               o.SaveToken = true;
               o.TokenValidationParameters = new TokenValidationParameters
               {
                   ValidateIssuerSigningKey = true,
                   ValidateIssuer = true,
                   ValidateAudience = true,
                   ValidateLifetime = true,
                   IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings?.Key!)),
                   ValidIssuer = jwtSettings?.Issuer,
                   ValidAudience = jwtSettings?.Audience 
               };
           });

            //services.Configure<IdentityOptions>(options =>
            //{
            //    options.Password.RequiredLength = 8;

            //    options.SignIn.RequireConfirmedEmail = true;
            //    options.User.RequireUniqueEmail = true;

            //});

            return services;
        }
    }
}
