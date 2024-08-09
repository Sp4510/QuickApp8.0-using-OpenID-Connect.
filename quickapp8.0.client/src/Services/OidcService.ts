import { ILoginDto, ILoginResponseDto } from "../types/auth.types";
import axiosInstance from "../utils/axiosInstance";
import { OIDC_URL } from "../utils/globalConfig";

export const OidcService = async (LoginData: ILoginDto) => {
    const header = { "Content-Type": "application/x-www-form-urlencoded" };
    const data = new URLSearchParams();
    const client_id = "quickapp_spa";
    const scope = "openid email profile roles offline_access";

    data.append("client_id", client_id);
    data.append("grant_type", "password");
    data.append("username", LoginData.userName);
    data.append("password", LoginData.password);
    data.append("scope", scope);

    const response = await axiosInstance.post<ILoginResponseDto>(OIDC_URL, data, {
      headers: header,}
    );
    return response;
}