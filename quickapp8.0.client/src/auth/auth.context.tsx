import {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useReducer,
} from "react";
import {
  IAuthContext,
  IAuthContextAction,
  IAuthContextActionTypes,
  IAuthContextState,
} from "../types/auth.types";
import {
  PATH_AFTER_LOGIN,
  PATH_AFTER_LOGOUT,
  PATH_AFTER_REGISTER,
  REGISTER_URL,
  USERNAMES_LIST_URL
} from "../utils/globalConfig";
import { setSession } from "./auth.utils";
import axiosInstance from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AxiosResponse } from "axios";
import { decodeIdentityToken } from "../Services/JwtHelper";
import { OidcService } from "../Services/OidcService";

// We need a reducer function for useReducer hook
const authReducer = (state: IAuthContextState, action: IAuthContextAction) => {
  if (action.type === IAuthContextActionTypes.LOGIN) {
    return {
      ...state,
      isAuthenticated: true,
      isAuthLoading: false,
      user: action.payload,
    };
  }
  if (action.type === IAuthContextActionTypes.LOGOUT) {
    return {
      ...state,
      isAuthenticated: false,
      isAuthLoading: false,
      user: undefined,
    };
  }
  return state;
};

// We need an initial state object for useReducer hook
const initialAuthState: IAuthContextState = {
  isAuthenticated: false,
  isAuthLoading: true,
  user: undefined,
};

// We create our context here and export it
export const AuthContext = createContext<IAuthContext | null>(null);

// We need an interface for our context props
interface IProps {
  children: ReactNode;
}

// We create a component to manage all auth functionalities and export it and use it
const AuthContextProvider = ({ children }: IProps) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const navigate = useNavigate();

  // Initialize Method
  const initializeAuthContext = useCallback(async () => {
    try {
      const id_token = localStorage.getItem("id_token");
      const accesstoken = localStorage.getItem("accessToken");

      if (id_token != null) {
        setSession(accesstoken);
          const username = localStorage.getItem("username");
          const userInfo = await axiosInstance.get(`${USERNAMES_LIST_URL}/${username}`);
        dispatch({
          type: IAuthContextActionTypes.LOGIN,
          payload: userInfo.data,
        });
      } else {
        setSession(null);
        dispatch({
          type: IAuthContextActionTypes.LOGOUT,
        });
      }
    } catch (error) {
      //setSession(null);
      dispatch({
        type: IAuthContextActionTypes.LOGOUT,
      });
    }
  }, []);

  // In start of Application, We call initializeAuthContext to be sure about authentication status
  useEffect(() => {
    console.log("AuthContext Initialization start");
    initializeAuthContext()
      .then(() => console.log("initializeAuthContext was successfull"))
      .catch((error) => console.log(error));
  }, []);

  // Register Method
  const register = useCallback(
    async (
      fullName: string,
      userName: string,
      email: string,
      password: string,
      confirmPassword: string
    ) => {
      const response = await axiosInstance.post(REGISTER_URL, {
        fullName,
        userName,
        email,
        password,
        confirmPassword,
      });
      console.log("Register Result:", response);
      toast.success("Register was Successfull. Please Login.");
      navigate(PATH_AFTER_REGISTER);
    },[]);

  // Login Method
  const login = useCallback(async (userName: string, password: string) => {
    const response: AxiosResponse = await OidcService({ userName, password });

    const accessToken = response.data.access_token;
    const id_token = response.data.id_token;

    const CURRENT_USER_ID_TOKEN = decodeIdentityToken(id_token);

    localStorage.setItem("user", JSON.stringify(CURRENT_USER_ID_TOKEN));
    localStorage.setItem("id_token", id_token);
    localStorage.setItem("username", CURRENT_USER_ID_TOKEN.name);
    toast.success("Login Was Successful");

  // In response, we receive jwt token and user
    setSession(accessToken);

    const userInfo = await axiosInstance.get(`${USERNAMES_LIST_URL}/${CURRENT_USER_ID_TOKEN.name}`);

    dispatch({
      type: IAuthContextActionTypes.LOGIN,
      payload: userInfo.data,
    });
    navigate(PATH_AFTER_LOGIN);
    //setTimeout(() => {
    //  alert("Session is Out, Please Login Again..");
    //  navigate(PATH_AFTER_LOGOUT);
    //  localStorage.clear();
    //}, (CURRENT_USER_ID_TOKEN.exp - CURRENT_USER_ID_TOKEN.iat)*1000);
  }, []);

  // Logout Method
  const logout = useCallback(() => {
    setSession(null);
    localStorage.removeItem("user");
    localStorage.removeItem("id_token");
    dispatch({
      type: IAuthContextActionTypes.LOGOUT,
    });
    navigate(PATH_AFTER_LOGOUT);
  }, []);

  // We create an object for values of context provider
  // This will keep our code more redable
  const valuesObject = {
    isAuthenticated: state.isAuthenticated,
    isAuthLoading: state.isAuthLoading,
    user: state.user,
    register,
    login,
    logout,
  };
  return (
    <AuthContext.Provider value={valuesObject}>{children}</AuthContext.Provider>
  );
};

export default AuthContextProvider;
