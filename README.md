# VENDOR MANAGEMENT SYSTEM SERVICES

## User

-   Show User

    ```http
    GET domain/api/user/
    ```

    Expected response :

    -   STATUS 200

    ```json
    {
      "status" : 200,
      "count" : ,
      "data" : [
          {
              "USER_ID" : ,
              "MGR_ID" : ,
              "EMAIL" : ,
              "NAME" : ,
              "ROLE" : ,
              "CREATED_AT" : ,
              "UPDATED_AT" : ,
              "IS_ACTIVE" :
          },
          ...
      ]
    }

    ```

-   Create User

    ```http
    POST domain/api/user/
    ```

    Expected request :

    ```json
    {
      "MGR_ID" : string(30),
      "EMAIL" : string(30),
      "NAME" : string(30),
      "ROLE" : string(1)
    }
    ```

    Expected response :

    -   STATUS 200

    ```json
    {
        "status": 200,
        "message": "User success created"
    }
    ```

    -   STATUS 400

    ```json
    {
        "status": 400,
        "message": "Bad request"
    }
    ```
