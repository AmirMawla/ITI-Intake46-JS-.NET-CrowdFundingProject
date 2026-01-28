using CroudFund_DAL.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using CroudFund_DAL.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static System.Net.Mime.MediaTypeNames;
using static System.Runtime.InteropServices.JavaScript.JSType;
using CroudFund_DAL.Data;

namespace CroudFund_DAL.Data
{
    public static class SeedData
    {

        public static async Task SeedAsync(AppDbContext context, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
        {
            // Seed Roles
            await SeedRolesAsync(roleManager);

            // Seed Users
            var userIds = await SeedUsersAsync(userManager);

            // Seed Categories
            await SeedCategoriesAsync(context);

            // Seed Campaigns
            await SeedCampaignsAsync(context, userIds);

            // Seed Pledges
            await SeedPledgesAsync(context, userIds);

            // Seed Payments
            await SeedPaymentsAsync(context);

            // Seed Reviews
            await SeedReviewsAsync(context, userIds);
        }

        private static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager)
        {
            string[] roles = { "Admin", "User" };

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            }
        }

        private static async Task<Dictionary<int, string>> SeedUsersAsync(UserManager<ApplicationUser> userManager)
        {
            var userIds = new Dictionary<int, string>();

            var users = new[]
            {
        new { Id = 1, FullName = "System Administrator", Email = "admin@fundhub.com", Password = "Admin@123", Role = "Admin", CreatedAt = new DateTime(2024, 1, 1)  , Image = "/images/users/49e8886f-d2d6-4883-ac1c-e90daa06ef00_صورة واتساب بتاريخ 2025-11-13 في 00.17.32_ac908675.jpg"},
        new { Id = 2, FullName = "Ahmed Nasser", Email = "ahmed@fundhub.com", Password = "User@123", Role = "User", CreatedAt = new DateTime(2024, 1, 10) , Image = "/images/users/1.webp" },
        new { Id = 3, FullName = "Mariam Khaled", Email = "mariam@fundhub.com", Password = "User@123", Role = "User", CreatedAt = new DateTime(2024, 1, 15) ,Image = "/images/users/dd83ddc4-d46c-43ae-b492-49797b3ab670_466.jpg" },
        new { Id = 4, FullName = "Youssef Adel", Email = "youssef@fundhub.com", Password = "User@123", Role = "User", CreatedAt = new DateTime(2024, 1, 20) ,Image = "/images/users/2.webp" },
        new { Id = 5, FullName = "Salma Ibrahim", Email = "salma@fundhub.com", Password = "User@123", Role = "User", CreatedAt = new DateTime(2024, 2, 1) , Image = "/images/users/4.webp" },
        new { Id = 6, FullName = "Omar Fathy", Email = "omar@fundhub.com", Password = "User@123", Role = "User", CreatedAt = new DateTime(2024, 2, 10)  , Image = "/images/users/3.webp"}
            };

            foreach (var userData in users)
            {
                var user = await userManager.FindByEmailAsync(userData.Email);

                if (user == null)
                {
                    user = new ApplicationUser
                    {
                        FullName = userData.FullName,
                        Email = userData.Email,
                        UserName = userData.Email,
                        EmailConfirmed = true,
                        IsActive = true,
                        ProfileImage = userData.Image,
                        CreatedAt = userData.CreatedAt
                    };

                 

                    var result = await userManager.CreateAsync(user, userData.Password);

                    if (result.Succeeded)
                    {
                        await userManager.AddToRoleAsync(user, userData.Role);
                        userIds[userData.Id] = user.Id;
                    }
                }
                else
                {
                    userIds[userData.Id] = user.Id;
                }
            }

            return userIds;
        }

        private static async Task SeedCategoriesAsync(AppDbContext context)
        {
            if (!context.Categories.Any())
            {
                var categories = new List<Category>
        {
            new Category { Name = "Technology", CreatedAt = new DateTime(2024, 1, 1) },
            new Category { Name = "Education", CreatedAt = new DateTime(2024, 1, 1) },
            new Category { Name = "Medical", CreatedAt = new DateTime(2024, 1, 1) },
            new Category { Name = "Community", CreatedAt = new DateTime(2024, 1, 1) },
            new Category { Name = "Environment", CreatedAt = new DateTime(2024, 1, 1) },
            new Category { Name = "Startups", CreatedAt = new DateTime(2024, 1, 1) }
        };

                await context.Categories.AddRangeAsync(categories);
                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedCampaignsAsync(AppDbContext context, Dictionary<int, string> userIds)
        {
            if (!context.Campaigns.Any())
            {
                var campaigns = new List<Campaign>
        {
            new Campaign
            {
                Title = "Smart Energy Management System",
                Description = "IoT platform to monitor and reduce energy consumption in buildings.",
                GoalAmount = 50000,
                Deadline = new DateTime(2027, 1, 31, 23, 59, 59),
                UserId = userIds[2],
                CategoryId = 1,
                Image = "/images/campaigns/1.webp", 
                IsApproved = true,
                CreatedAt = new DateTime(2024, 1, 20)
            },
            new Campaign
            {
                Title = "Online Coding School for Youth",
                Description = "Affordable coding education for students in underserved areas.",
                GoalAmount = 70000,
                Deadline = new DateTime(2027, 2, 15, 23, 59, 59),
                UserId = userIds[3],
                CategoryId = 2,
                 Image = "/images/campaigns/2.webp",
                IsApproved = true,
                CreatedAt = new DateTime(2024, 1, 25)
            },
            new Campaign
            {
                Title = "Cancer Treatment Support Fund",
                Description = "Helping patients cover urgent medical treatment costs.",
                GoalAmount = 45000,
                Deadline = new DateTime(2027, 12, 20, 23, 59, 59),
                UserId = userIds[4],
                CategoryId = 3,
                Image = "/images/campaigns/3.webp",
                IsApproved = true,
                CreatedAt = new DateTime(2024, 2, 1)
            },
            new Campaign
            {
                Title = "Community Recycling Program",
                Description = "Launching a local recycling initiative to reduce waste.",
                GoalAmount = 30000,
                Deadline = new DateTime(2027, 1, 10, 23, 59, 59),
                UserId = userIds[5],
                CategoryId = 4,
                Image = "/images/campaigns/4.webp",
                IsApproved = true,
                CreatedAt = new DateTime(2024, 3, 5)
            },
            new Campaign
            {
                Title = "AI Health Monitoring App",
                Description = "Mobile app for tracking health indicators using AI.",
                GoalAmount = 90000,
                Deadline = new DateTime(2027, 3, 1, 23, 59, 59),
                UserId = userIds[6],
                CategoryId = 6,
                Image = "/images/campaigns/5.webp",
                IsApproved = true,
                CreatedAt = new DateTime(2024, 4, 10)
            },
            new Campaign
            {
                Title = "Digital Library for Schools",
                Description = "Providing free digital books for public schools.",
                GoalAmount = 40000,
                Deadline = new DateTime(2025, 1, 5, 23, 59, 59),
                UserId = userIds[2],
                CategoryId = 2,
                Image = "/images/campaigns/6.webp",
                IsApproved = true,
                CreatedAt = new DateTime(2024, 2, 12)
            },
            new Campaign
            {
                Title = "Clean Water Wells Project",
                Description = "Building clean water wells in rural communities.",
                GoalAmount = 60000,
                Deadline = new DateTime(2027, 2, 20, 23, 59, 59),
                UserId = userIds[3],
                CategoryId = 4,
                Image = "/images/campaigns/7.webp",
                IsApproved = true,
                CreatedAt = new DateTime(2024, 5, 15)
            },
            new Campaign
            {
                Title = "Green Startup Accelerator",
                Description = "Supporting eco-friendly startups with funding and mentorship.",
                GoalAmount = 120000,
                Deadline = new DateTime(2027, 4, 1, 23, 59, 59),
                UserId = userIds[4],
                CategoryId = 6,
                IsApproved = false,
                CreatedAt = new DateTime(2024, 6, 18)
            },
            new Campaign
            {
                Title = "Mental Health Awareness Platform",
                Description = "Online platform for mental health education and support.",
                GoalAmount = 35000,
                Deadline = new DateTime(2027, 6, 30, 23, 59, 59),
                UserId = userIds[5],
                CategoryId = 3,
                Image = "/images/campaigns/8.webp",
                IsApproved = true,
                CreatedAt = new DateTime(2024, 4, 1)
            },
            new Campaign
            {
                Title = "Disaster Relief Emergency Fund",
                Description = "Rapid response fund for natural disaster victims.",
                GoalAmount = 50000,
                Deadline = new DateTime(2027, 12, 15, 23, 59, 59),
                UserId = userIds[6],
                CategoryId = 4,
                Image = "/images/campaigns/9.webp",
                IsApproved = true,
                CreatedAt = new DateTime(2024, 3, 5)
            },
            new Campaign
            {
                Title = "Solar Powered School Classrooms",
                Description = "Installing solar panels to power classrooms sustainably.",
                GoalAmount = 80000,
                Deadline = new DateTime(2027, 2, 10, 23, 59, 59),
                UserId = userIds[2],
                CategoryId = 5,
                Image = "/images/campaigns/10.webp",
                IsApproved = true,
                CreatedAt = new DateTime(2024, 7, 8)
            },
            new Campaign
            {
                Title = "Healthcare Mobile Clinics",
                Description = "Mobile clinics providing healthcare in remote regions.",
                GoalAmount = 100000,
                Deadline = new DateTime(2028, 3, 15, 23, 59, 59),
                UserId = userIds[3],
                CategoryId = 3,
                Image = "/images/campaigns/11.webp",
                IsApproved = false,
                CreatedAt = new DateTime(2024, 2, 10)
            }
        };

                await context.Campaigns.AddRangeAsync(campaigns);
                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedPledgesAsync(AppDbContext context, Dictionary<int, string> userIds)
        {
            if (!context.Pledges.Any())
            {
                var pledges = new List<Pledge>
        {
            new Pledge { UserId = userIds[2], CampaignId = 1, Amount = 5000, CreatedAt = new DateTime(2025, 2, 1) },
            new Pledge { UserId = userIds[3], CampaignId = 1, Amount = 3000, CreatedAt = new DateTime(2025, 2, 2) },
            new Pledge { UserId = userIds[4], CampaignId = 2, Amount = 7000, CreatedAt = new DateTime(2025, 3, 3) },
            new Pledge { UserId = userIds[5], CampaignId = 2, Amount = 4000, CreatedAt = new DateTime(2025, 3, 4) },
            new Pledge { UserId = userIds[6], CampaignId = 3, Amount = 6000, CreatedAt = new DateTime(2025, 4, 5) },
            new Pledge { UserId = userIds[2], CampaignId = 3, Amount = 2500, CreatedAt = new DateTime(2025, 5, 6) },
            new Pledge { UserId = userIds[3], CampaignId = 4, Amount = 3500, CreatedAt = new DateTime(2025, 6, 7) },
            new Pledge { UserId = userIds[4], CampaignId = 4, Amount = 2000, CreatedAt = new DateTime(2025, 7, 8) },
            new Pledge { UserId = userIds[5], CampaignId = 5, Amount = 8000, CreatedAt = new DateTime(2025, 2, 9) },
            new Pledge { UserId = userIds[6], CampaignId = 5, Amount = 5000, CreatedAt = new DateTime(2025, 6, 10) },
            new Pledge { UserId = userIds[2], CampaignId = 6, Amount = 3000, CreatedAt = new DateTime(2025, 3, 11) },
            new Pledge { UserId = userIds[3], CampaignId = 7, Amount = 4500, CreatedAt = new DateTime(2025, 4, 12) },
            new Pledge { UserId = userIds[4], CampaignId = 7, Amount = 2500, CreatedAt = new DateTime(2025, 1, 13) },
            new Pledge { UserId = userIds[5], CampaignId = 9, Amount = 4000, CreatedAt = new DateTime(2025, 3, 14) },
            new Pledge { UserId = userIds[6], CampaignId = 9, Amount = 3500, CreatedAt = new DateTime(2025, 8, 15) },
            new Pledge { UserId = userIds[2], CampaignId = 10, Amount = 6000, CreatedAt = new DateTime(2025, 1, 16) },
            new Pledge { UserId = userIds[3], CampaignId = 11, Amount = 5500, CreatedAt = new DateTime(2025, 1, 17) },
            new Pledge { UserId = userIds[4], CampaignId = 11, Amount = 4500, CreatedAt = new DateTime(2025, 2, 18) }
        };

                await context.Pledges.AddRangeAsync(pledges);
                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedPaymentsAsync(AppDbContext context)
        {
            if (!context.Payments.Any())
            {
                var payments = new List<Payment>
        {
            new Payment { PledgeId = 1, Status = PaymentStatus.Success, PaymentMethod = "Visa", PaidAt = new DateTime(2025, 2, 1, 1, 0, 0) },
            new Payment { PledgeId = 2, Status = PaymentStatus.Success, PaymentMethod = "Mastercard", PaidAt = new DateTime(2025, 2, 2, 1, 0, 0) },
            new Payment { PledgeId = 3, Status = PaymentStatus.Success, PaymentMethod = "PayPal", PaidAt = new DateTime(2025, 3, 3, 1, 0, 0) },
            new Payment { PledgeId = 4, Status = PaymentStatus.Success, PaymentMethod = "Apple Pay", PaidAt = new DateTime(2025, 3, 4, 1, 0, 0) },
            new Payment { PledgeId = 5, Status = PaymentStatus.Success, PaymentMethod = "Google Pay", PaidAt = new DateTime(2025, 4, 5, 1, 0, 0) },
            new Payment { PledgeId = 6, Status = PaymentStatus.Success, PaymentMethod = "Bank Transfer", PaidAt = new DateTime(2025, 5, 6, 1, 0, 0) },
            new Payment { PledgeId = 7, Status = PaymentStatus.Success, PaymentMethod = "Visa", PaidAt = new DateTime(2025, 6, 7, 1, 0, 0) },
            new Payment { PledgeId = 8, Status = PaymentStatus.Success, PaymentMethod = "Mastercard", PaidAt = new DateTime(2025, 7, 8, 1, 0, 0) },
            new Payment { PledgeId = 9, Status = PaymentStatus.Success, PaymentMethod = "PayPal", PaidAt = new DateTime(2025, 2, 9, 1, 0, 0) },
            new Payment { PledgeId = 10, Status = PaymentStatus.Success, PaymentMethod = "Apple Pay", PaidAt = new DateTime(2025, 6, 10, 1, 0, 0) },
            new Payment { PledgeId = 11, Status = PaymentStatus.Success, PaymentMethod = "Google Pay", PaidAt = new DateTime(2025, 3, 11, 1, 0, 0) },
            new Payment { PledgeId = 12, Status = PaymentStatus.Success, PaymentMethod = "Bank Transfer", PaidAt = new DateTime(2025, 4, 12, 1, 0, 0) },
            new Payment { PledgeId = 13, Status = PaymentStatus.Success, PaymentMethod = "Visa", PaidAt = new DateTime(2025, 1, 13, 1, 0, 0) },
            new Payment { PledgeId = 14, Status = PaymentStatus.Success, PaymentMethod = "Mastercard", PaidAt = new DateTime(2025, 3, 14, 1, 0, 0) },
            new Payment { PledgeId = 15, Status = PaymentStatus.Success, PaymentMethod = "PayPal", PaidAt = new DateTime(2025, 8, 15, 1, 0, 0) },
            new Payment { PledgeId = 16, Status = PaymentStatus.Success, PaymentMethod = "Apple Pay", PaidAt = new DateTime(2025, 1, 16, 1, 0, 0) },
            new Payment { PledgeId = 17, Status = PaymentStatus.Success, PaymentMethod = "Google Pay", PaidAt = new DateTime(2025, 1, 17, 1, 0, 0) },
            new Payment { PledgeId = 18, Status = PaymentStatus.Success, PaymentMethod = "Bank Transfer", PaidAt = new DateTime(2025, 2, 18, 1, 0, 0) }
        };

                await context.Payments.AddRangeAsync(payments);
                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedReviewsAsync(AppDbContext context, Dictionary<int, string> userIds)
        {
            if (!context.Reviews.Any())
            {
                var reviews = new List<Review>
        {
            new Review
            {
                UserId = userIds[2],
                CampaignId = 1,
                Comment = "Great initiative, very promising technology.",
                Reaction = Reaction.Like,
                CreatedAt = new DateTime(2025, 12, 10)
            },
            new Review
            {
                UserId = userIds[3],
                CampaignId = 2,
                Comment = "This project will really help students.",
                Reaction = Reaction.Love,
                CreatedAt = new DateTime(2025, 12, 11)
            },
            new Review
            {
                UserId = userIds[4],
                CampaignId = 3,
                Comment = "Very important medical support.",
                Reaction = Reaction.Support,
                CreatedAt = new DateTime(2025, 12, 12)
            },
            new Review
            {
                UserId = userIds[5],
                CampaignId = 4,
                Comment = "Happy to contribute to my community.",
                Reaction = Reaction.Like,
                CreatedAt = new DateTime(2025, 12, 13)
            },
            new Review
            {
                UserId = userIds[6],
                CampaignId = 5,
                Comment = "Innovative idea, looking forward to results.",
                Reaction = Reaction.Love,
                CreatedAt = new DateTime(2025, 12, 14)
            }
        };

                await context.Reviews.AddRangeAsync(reviews);
                await context.SaveChangesAsync();
            }
        }
    }
}




