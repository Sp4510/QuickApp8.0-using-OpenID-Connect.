using OpenIddict.Abstractions;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace QuickApp8._0.Server.Configuration
{
    public static class OidcServerConfiguration
    {
        public const string ServerName = "QuickApp API";
        public const string OuickAppClientID = "quickapp_spa";
        public const string SwaggerClientID = "swagger_ui";

        public static async Task RegisterClientApplicationsAsync (IServiceProvider provider)
        {
            var manager = provider.GetRequiredService<IOpenIddictApplicationManager>();

            if (await manager.FindByClientIdAsync(OuickAppClientID) is null)
            {
                await manager.CreateAsync( new OpenIddictApplicationDescriptor
                {
                    ClientId = OuickAppClientID,
                    ClientType = ClientTypes.Public,
                    DisplayName = "QuickApp",
                    Permissions =
                    {
                        Permissions.Endpoints.Token,
                        Permissions.GrantTypes.Password,
                        Permissions.GrantTypes.RefreshToken,
                        Permissions.Scopes.Profile,
                        Permissions.Scopes.Email,
                        Permissions.Scopes.Address,
                        Permissions.Scopes.Phone,
                        Permissions.Scopes.Roles,
                    }
                });
            }
        }
    }
}
