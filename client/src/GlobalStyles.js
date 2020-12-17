import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
    *{
        margin: 0;
        padding:0;
        box-sizing: border-box;
    }
    html{
    background: white;
		font-family: "Roboto", sans-serif;
		}
	
	h1{
		font-family: 'Abril Fatface', cursive;
		font-size:3.2rem;
		margin: 1rem 0rem;
	}
	`;

export default GlobalStyles;
