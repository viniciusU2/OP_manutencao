import styled from "styled-components";

const Container = styled.div`
  width: 100%;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: "Poppins", sans-serif;
  font-weight: 500;
  font-style: normal;

  @media (max-width: 768px) {
    padding: 16px 0;
  }

  @media (max-width: 480px) {
    padding: 12px 0;
  }
`;

export default Container;
