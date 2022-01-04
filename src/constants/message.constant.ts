export const responseMessage = {
    appResponse: {
        corsError: 'Access denied by CORS',
    },
    passportResponse: {
        accessTokenMissingError: 'Access token missing in header',
    },
    authControllerResponse: {
        loginSuccess: 'User login successfully, ',
        signUpSuccess: 'User signUp successfully',
        userUpdateSuccess: 'User updated successfully',
        userAlreadyExistError: 'User Already exist', 
        getUserSuccess: 'User fetched successfully',
        getUsersSuccess: 'users fetched successfully',
        getUserError: 'User does not exist',
        userNotAuthorizationError: 'User not authorized',
        userInvalidPasswordError: 'Password is incorrect',
        passwordUpdateSuccess: 'Password has been changed successfully',
        deleteUserSuccess: 'User deleted successfully',
        createUserFailed: 'Failed to create user'
    },
    adminControllerResponse: {
        addUserSuccess: 'User added successfully',
        createAdminSuccess: 'Admin added successfully',
        AdminExistError: 'Admin already exist and verified',
        createAdminFailure: 'Failed to add admin',
        updateAdminSuccess: 'Admin updated successfully',
        deleteAdminSuccess: 'Admin deleted successfully',
        fetchAdminSuccess: 'Admin details fetched successfully',
        getAdminFailure: 'Admin does not exist',
        sendCodeSuccess: 'Verification code successfully sent on your email',
        sendCodeFailure: 'Failed to send code',
        verifyCodeSuccess: 'Code already sended on your email on your signUp request, please verify with code',
        forgotPassowrdFailure: 'Failed to proceed your request, please try again',
        updateCodeFailure: 'Failed to proceed verification code',
        codeVerificationFailure: 'Invalid code provided',
        failedToSendPassword: 'Failed to send password on email',
        sentEmailFailure: 'Failed to send email, please try again',
        forgotPassowrdSuccess: 'Password updated successfully'
    },
    subscriptionsControllerResponse: {
        createSubscriptionSuccess: 'Subscription added successfully',
        updateSubscriptionSuccess: 'Subscription updated successfully',
        deleteSubscriptionSuccess: 'Subscription deleted successfully',
        fetchSubscriptionSuccess: 'Subscription details fetched successfully',
        fetchSubscriptionsSuccess: 'Subscriptions list fetched successfully',
        createSubscriptionFailure: 'Subscription already added',
        getSubscriptionFailure: 'Failed to fetch subscription details',
        subscriptionIsInUsedError: 'Subscription plan is active in user account',
    },
    dashboardControllerResponse: {
        getDashboardSuccess: 'Dashboard details fetched successfully'
    },   
}
