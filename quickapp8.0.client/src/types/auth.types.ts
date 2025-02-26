export interface IRegisterDto {
    fullName:string;
    userName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface ILoginDto {
    userName: string;
    password: string;
}

export interface IUpdateRoleDto {
    userName: string;
    newRole: string;
}

export interface IAuthUser {
    id:string;
    fullName: string;
    userName: string;
    email: string;
    createdAt: string;
    roles: string[];
    isBlocked : true|false;
}

export interface ILoginResponseDto {
    newToken: string;
    id_token: string;
    access_token: string;
    refresh_token: string;
    userInfo: IAuthUser;
}

export interface IAuthContextState {
    isAuthenticated: boolean;
    isAuthLoading: boolean;
    user?:IAuthUser;
}

export enum IAuthContextActionTypes {
    INITIAL = 'INITIAL',
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
}

export interface IAuthContextAction {
    type: IAuthContextActionTypes;
    payload?: IAuthUser; 
}

export interface IAuthContext {
    isAuthenticated: boolean;
    isAuthLoading: boolean;
    user?:IAuthUser;
    login: (userName: string, password: string) => Promise<void>;
    register: (
        fullName: string,
        userName: string,
        email: string,
        password: string,
        confirmPassword: string,
    ) => Promise<void>;
    logout: () => void;
}

export enum RolesEnum {
    OWNER = 'OWNER',
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    USER = 'USER'
}
export interface IUser {
    id:string;
    fullName: string;
    userName: string;
    email: string;
    roles: string[];
}
