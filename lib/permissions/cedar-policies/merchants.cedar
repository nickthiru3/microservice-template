permit(
    principal,
    action in [MyApp::Action::"CreateDeal"
],
    resource
) when {
    resource == "arn:aws:execute-api:<region>:<account-id>:<api-id>/<stage>/merchant/*" && principal in [MyApp::UserGroup::"Merchants"
  ]
};