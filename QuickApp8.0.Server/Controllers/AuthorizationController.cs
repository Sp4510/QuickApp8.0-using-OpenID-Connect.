using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using QuickApp8._0.Server.Core.Entities;
using QuickApp8._0.Server.Core.Interfaces;
using System.Security.Claims;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace QuickApp8._0.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthorizationController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogService _logService;
        private readonly SignInManager<ApplicationUser> _signInManager;

        public AuthorizationController(SignInManager<ApplicationUser> signInManager, UserManager<ApplicationUser> userManager, ILogService logService)
        {
            _signInManager = signInManager;
            _userManager = userManager;
            _logService = logService;
        }

        [HttpPost("~/connect/token")]
        public async Task<IActionResult> Exchange()
        {
            var request = HttpContext.GetOpenIddictServerRequest()
                ?? throw new InvalidOperationException("The OpenID Connect request cannot be retrieved");

            if (request.IsPasswordGrantType())
            {
                if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
                    return BadRequest("Username or Password cannot be empty.");

                var user = await _userManager.FindByNameAsync(request.Username)
                    ?? await _userManager.FindByEmailAsync(request.Password);

                if (user == null)
                    return BadRequest("Check the Username and Password is correct.");

                var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure:true);

                if (result.IsLockedOut)
                    return BadRequest("The user account has been suspended.");

                if (user.IsBlocked)
                    return BadRequest("The user account has been Blocked.");

                if (result.IsNotAllowed)
                    return BadRequest("The user is not allowed to sign in.");

                if (!result.Succeeded)
                    return BadRequest("Check the Username and Password is correct.");

                var principal = await CreateClaimsPrincipalAsync(user, request.GetScopes());

                await _logService.SaveNewLog(user.UserName, "New Login");

                return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            }
            else if (request.IsRefreshTokenGrantType())
            {
                var result = await HttpContext.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);

                var userId = result?.Principal?.GetClaim(Claims.Subject);
                var user = userId != null ? await _userManager.FindByIdAsync(userId) : null;

                if (user == null)
                    return BadRequest("The refresh token is no longer valid.");

                if (!await _signInManager.CanSignInAsync(user))
                    return BadRequest("The user is no longer allowed to sign in.");

                var scopes = request.GetScopes();
                if (scopes.Length == 0 && result?.Principal != null)
                    scopes = result.Principal.GetScopes();

                // Recreate the claims principal in change the refresh token issued
                var principal = await CreateClaimsPrincipalAsync(user, scopes);

                return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            }
            throw new InvalidOperationException($"The grant type \"{request.GrantType}\" is not supported.");
        }

        private async Task<ClaimsPrincipal> CreateClaimsPrincipalAsync(ApplicationUser user, IEnumerable<string> scopes)
        {
            var principal = await _signInManager.CreateUserPrincipalAsync(user);
            principal.SetScopes(scopes);

            var identity = principal.Identity as ClaimsIdentity
                ?? throw new InvalidOperationException("The ClaimsPrincipals Identity is null.");

            if (user.FullName != null) identity.SetClaim("FullName", user.FullName);
            if (user.CreatedAt != null) identity.SetClaim("CreatedAt", Convert.ToString(user.CreatedAt));

            principal.SetDestinations(GetDestinations);

            return principal;
        }

        private static IEnumerable<string> GetDestinations(Claim claim)
        {
            if (claim.Subject == null)
                throw new InvalidOperationException("The Claim's Subject is null.");

            switch (claim.Type)
            {
                case Claims.Name:
                    yield return Destinations.AccessToken;
                    if (claim.Subject.HasScope(Scopes.Profile))
                        yield return Destinations.IdentityToken;

                    yield break;

                case Claims.Email:
                    yield return Destinations.AccessToken;
                    if (claim.Subject.HasScope(Scopes.Email))
                        yield return Destinations.IdentityToken;

                    yield break;

                case "FullName":
                    if (claim.Subject.HasScope(Scopes.Profile))
                        yield return Destinations.IdentityToken;

                    yield break;

                case "CreatedAt":
                    if (claim.Subject.HasScope(Scopes.Profile))
                        yield return Destinations.IdentityToken;

                    yield break;

                case Claims.Role:
                    yield return Destinations.AccessToken;
                    if (claim.Subject.HasScope(Scopes.Roles))
                        yield return Destinations.IdentityToken;

                    yield break;

                case "AspNet.Identity.SecurityStamp":
                    // Never include the security stamp in the access and identity tokens, as it's a secret value.
                    yield break;

                default:
                    yield return Destinations.AccessToken;

                    yield break;
            }
        }
    }
}
