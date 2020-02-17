jQuery.sap.declare("sap.secmon.ui.m.semanticEventFS.utils.ControllerHelper");
jQuery.sap.require("sap.secmon.ui.m.semanticEventFS.utils.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");

sap.secmon.ui.m.semanticEventFS.utils.ControllerHelper =
        function() {
            this.getTemplate = function() {

                return new sap.m.ColumnListItem({
                    cells : [ new sap.m.Text({
                        text : {
                            parts : [ {
                                path : 'applicationContext>/UTC'
                            }, {
                                path : 'Timestamp'
                            } ],
                            formatter : sap.secmon.ui.commons.Formatter.dateFormatterEx
                        },
                    }), new sap.m.Text({
                        text : "{path : 'EventSemantic'}"
                    }), new sap.m.Text({
                        text : "{path : 'Event'}"
                    }), new sap.m.Text({
                        text : "{path : 'EventLogType'}"
                    }), new sap.m.Text({
                        text : {
                            parts : [ {
                                path : 'UserPseudonymInitiating'
                            }, {
                                path : 'UserPseudonymActing'
                            }, {
                                path : 'UserPseudonymTargeted'
                            }, {
                                path : 'UserPseudonymTargeting'
                            } ],
                            formatter : sap.secmon.ui.m.semanticEventFS.utils.Formatter.userSummarizer
                        }
                    }), new sap.m.Text({
                        text : "{path : 'UserPseudonymInitiating'}"
                    }), new sap.m.Text({
                        text : "{path : 'UserPseudonymActing'}"
                    }), new sap.m.Text({
                        text : "{path : 'UserPseudonymTargeted'}"
                    }), new sap.m.Text({
                        text : "{path : 'UserPseudonymTargeting'}"
                    }), new sap.m.Text({
                        text : {
                            parts : [ {
                                path : 'SystemIdActor'
                            }, {
                                path : 'SystemTypeActor'
                            }, {
                                path : 'SystemIdInitiator'
                            }, {
                                path : 'SystemTypeInitiator'
                            }, {
                                path : 'SystemIdIntermediary'
                            }, {
                                path : 'SystemTypIntermediary'
                            }, {
                                path : 'SystemIdReporter'
                            }, {
                                path : 'SystemTypeReporter'
                            }, {
                                path : 'SystemIdTarget'
                            }, {
                                path : 'SystemTypeTarget'
                            } ],
                            formatter : sap.secmon.ui.m.semanticEventFS.utils.Formatter.systemSummarizer
                        }
                    }), new sap.m.Text({
                        text : "{path : 'SystemIdActor'}"
                    }), new sap.m.Text({
                        text : "{path : 'SystemTypeActor'}"
                    }), new sap.m.Text({
                        text : "{path : 'SystemIdInitiator'}"
                    }), new sap.m.Text({
                        text : "{path : 'SystemTypeInitiator'}"
                    }), new sap.m.Text({
                        text : "{path : 'SystemIdIntermediary'}"
                    }), new sap.m.Text({
                        text : "{path : 'SystemTypeIntermediary'}"
                    }), new sap.m.Text({
                        text : "{path : 'SystemIdReporter'}"
                    }), new sap.m.Text({
                        text : "{path : 'SystemTypeReporter'}"
                    }), new sap.m.Text({
                        text : "{path : 'SystemIdTarget'}"
                    }), new sap.m.Text({
                        text : "{path : 'SystemTypeTarget'}"
                    }), new sap.m.Text({
                        text : {
                            parts : [ {
                                path : 'ServiceTransactionName'
                            }, {
                                path : 'ServiceProgramName'
                            } ],
                            formatter : sap.secmon.ui.m.semanticEventFS.utils.Formatter.serviceSummarizer
                        }
                    }), new sap.m.Text({
                        text : "{path : 'ServiceTransactionName'}"
                    }), new sap.m.Text({
                        text : "{path : 'ServiceProgramName'}"
                    }), new sap.m.Text({
                        text : "{path : 'TechnicalGroupId'}"
                    }), new sap.m.Text({
                        text : {
                            parts : [ {
                                path : 'applicationContext>/UTC'
                            }, {
                                path : 'TechnicalTimestampOfInsertion'
                            } ],
                            formatter : sap.secmon.ui.commons.Formatter.dateFormatterEx
                        }
                    }), new sap.m.Text({
                        text : "{path : 'AttackName'}"
                    }), new sap.m.Text({
                        text : "{path : 'AttackType'}"
                    }), new sap.m.Text({
                        text : "{path : 'CorrelationId'}"
                    }), new sap.m.Text({
                        text : "{path : 'CorrelationSubId'}"
                    }), new sap.m.Text({
                        text : "{path : 'EventMessage'}",
                        maxLines : 4
                    }), new sap.m.Text({
                        text : "{path : 'EventScenarioRoleOfActor'}"
                    }), new sap.m.Text({
                        text : "{path : 'EventScenarioRoleOfInitiator'}"
                    }), new sap.m.Text({
                        text : "{path : 'EventSeverityCode'}"
                    }), new sap.m.Text({
                        text : "{path : 'EventSourceId'}"
                    }), new sap.m.Text({
                        text : "{path : 'EventSourceType'}"
                    }), new sap.m.Text({
                        text : "{path : 'GenericAction'}"
                    }), new sap.m.Text({
                        text : "{path : 'GenericCategory'}"
                    }), new sap.m.Text({
                        text : "{path : 'GenericDeviceType'}"
                    }), new sap.m.Text({
                        text : "{path : 'GenericExplanation'}"
                    }), new sap.m.Text({
                        text : "{path : 'GenericGeolocationCodeTarget'}"
                    }), new sap.m.Text({
                        text : "{path : 'GenericOrder'}"
                    }), new sap.m.Text({
                        text : "{path : 'GenericOutcome'}"
                    }), new sap.m.Text({
                        text : "{path : 'GenericOutcomeReason'}"
                    }), new sap.m.Text({
                        text : "{path : 'GenericPath'}"
                    }), new sap.m.Text({
                        text : "{path : 'GenericPathPrior'}"
                    }), new sap.m.Text({
                        text : "{path : 'GenericPurpose'}"
                    }), new sap.m.Text({
                        text : "{path : 'GenericRiskLevel'}"
                    }), new sap.m.Text({
                        text : "{path : 'GenericScore'}"
                    }), new sap.m.Text({
                        text : "{path : 'GenericSessionId'}"
                    }), new sap.m.Text({
                        text : "{path : 'GenericURI'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkHostnameActor'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkHostnameInitiator'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkHostnameIntermediary'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkHostnameReporter'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkHostnameTarget'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkHostDomainActor'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkHostDomainInitiator'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkHostDomainIntermediary'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkHostDomainReporter'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkHostDomainTarget'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkInterfaceActor'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkInterfaceTarget'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkIPBeforeNATActor'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkIPBeforeNATTarget'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkMACAddressActor'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkMACAddressInitiator'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkMACAddressIntermediary'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkMACAddressReporter'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkMACAddressTarget'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkNetworkPrefixActor'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkNetworkPrefixTarget'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkPortActor'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkPortInitiator'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkPortIntermediary'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkPortReporter'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkPortTarget'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkPortBeforeNATActor'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkPortBeforeNATTarget'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkProtocol'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkSessionId'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkSubnetIdActor'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkSubnetLocationActor'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkSubnetIdInitiator'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkSubnetCategoryInitiator'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkSubnetLocationInitiator'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkSubnetIdIntermediary'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkSubnetCategoryIntermediary'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkSubnetLocationIntermediary'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkSubnetIdReporter'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkSubnetCategoryReporter'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkSubnetLocationReporter'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkSubnetCategoryTarget'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkSubnetLocationTarget'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkZoneActor'}"
                    }), new sap.m.Text({
                        text : "{path : 'NetworkZoneTarget'}"
                    }), new sap.m.Text({
                        text : "{path : 'ParameterDirection'}"
                    }), new sap.m.Text({
                        text : "{path : 'ParameterDirectionContext'}"
                    }), new sap.m.Text({
                        text : "{path : 'ParameterName'}"
                    }), new sap.m.Text({
                        text : "{path : 'ParameterNameContext'}"
                    }), new sap.m.Text({
                        text : "{path : 'ParameterDataType'}"
                    }), new sap.m.Text({
                        text : "{path : 'ParameterDataTypeContext'}"
                    }), new sap.m.Text({
                        text : "{path : 'ParameterType'}"
                    }), new sap.m.Text({
                        text : "{path : 'ParameterTypeContext'}"
                    }), new sap.m.Text({
                        text : "{path : 'ParameterValueNumber'}"
                    }), new sap.m.Text({
                        text : "{path : 'ParameterValueNumberContext'}"
                    }), new sap.m.Text({
                        text : "{path : 'ParameterValueNumberPriorValue'}"
                    }), new sap.m.Text({
                        text : "{path : 'ParameterValueString'}"
                    }), new sap.m.Text({
                        text : "{path : 'ParameterValueStringContext'}"
                    }), new sap.m.Text({
                        text : "{path : 'ParameterValueStringPriorValue'}"
                    }), new sap.m.Text({
                        text : "{path : 'ParameterValueDouble'}"
                    }), new sap.m.Text({
                        text : "{path : 'ParameterValueDoublePriorValue'}"
                    }), new sap.m.Text({
                        text : {
                            parts : [ {
                                path : 'applicationContext>/UTC'
                            }, {
                                path : 'ParameterValueTimestamp'
                            } ],
                            formatter : sap.secmon.ui.commons.Formatter.dateFormatterEx
                        }
                    }), new sap.m.Text({
                        text : {
                            parts : [ {
                                path : 'applicationContext>/UTC'
                            }, {
                                path : 'ParameterValueTimestampPriorValue'
                            } ],
                            formatter : sap.secmon.ui.commons.Formatter.dateFormatterEx
                        }
                    }), new sap.m.Text({
                        text : "{path : 'PrivilegeIsGrantable'}"
                    }), new sap.m.Text({
                        text : "{path : 'PrivilegeName'}"
                    }), new sap.m.Text({
                        text : "{path : 'PrivilegeType'}"
                    }), new sap.m.Text({
                        text : "{path : 'PrivilegeGranteeName'}"
                    }), new sap.m.Text({
                        text : "{path : 'PrivilegeGranteeType'}"
                    }), new sap.m.Text({
                        text : "{path : 'ResourceContainerName'}"
                    }), new sap.m.Text({
                        text : "{path : 'ResourceContainerType'}"
                    }), new sap.m.Text({
                        text : "{path : 'ResourceContentType'}"
                    }), new sap.m.Text({
                        text : "{path : 'ResourceCount'}"
                    }), new sap.m.Text({
                        text : "{path : 'ResourceName'}"
                    }), new sap.m.Text({
                        text : "{path : 'ResourceNamePrior'}"
                    }), new sap.m.Text({
                        text : "{path : 'ResourceRequestSize'}"
                    }), new sap.m.Text({
                        text : "{path : 'ResourceResponseSize'}"
                    }), new sap.m.Text({
                        text : "{path : 'ResourceSize'}"
                    }), new sap.m.Text({
                        text : "{path : 'ResourceType'}"
                    }), new sap.m.Text({
                        text : "{path : 'ResourceSumCriteria'}"
                    }), new sap.m.Text({
                        text : "{path : 'ResourceSumOverTime'}"
                    }), new sap.m.Text({
                        text : "{path : 'ResourceUnitsOfMeasure'}"
                    }), new sap.m.Text({
                        text : "{path : 'ServiceAccessName'}"
                    }), new sap.m.Text({
                        text : "{path : 'ServiceFunctionName'}"
                    }), new sap.m.Text({
                        text : "{path : 'ServiceReferrer'}"
                    }), new sap.m.Text({
                        text : "{path : 'ServiceRequestLine'}"
                    }), new sap.m.Text({
                        text : "{path : 'ServiceType'}"
                    }), new sap.m.Text({
                        text : "{path : 'ServiceVersion'}"
                    }), new sap.m.Text({
                        text : "{path : 'ServiceApplicationName'}"
                    }), new sap.m.Text({
                        text : "{path : 'ServiceExecutableName'}"
                    }), new sap.m.Text({
                        text : "{path : 'ServiceExecutableType'}"
                    }), new sap.m.Text({
                        text : "{path : 'ServiceOutcome'}"
                    }), new sap.m.Text({
                        text : "{path : 'ServicePartId'}"
                    }), new sap.m.Text({
                        text : "{path : 'ServiceProcessId'}"
                    }), new sap.m.Text({
                        text : "{path : 'ServiceUserAgent'}"
                    }), new sap.m.Text({
                        text : "{path : 'ServiceWorkflowName'}"
                    }), new sap.m.Text({
                        text : "{path : 'SystemGroupIdActor'}"
                    }), new sap.m.Text({
                        text : "{path : 'SystemGroupIdInitiator'}"
                    }), new sap.m.Text({
                        text : "{path : 'SystemGroupIdIntermediary'}"
                    }), new sap.m.Text({
                        text : "{path : 'SystemGroupIdReporter'}"
                    }), new sap.m.Text({
                        text : "{path : 'SystemGroupIdTarget'}"
                    }), new sap.m.Text({
                        text : "{path : 'SystemGroupTypeActor'}"
                    }), new sap.m.Text({
                        text : "{path : 'SystemGroupTypeInitiator'}"
                    }), new sap.m.Text({
                        text : "{path : 'SystemGroupTypeIntermediary'}"
                    }), new sap.m.Text({
                        text : "{path : 'SystemGroupTypeReporter'}"
                    }), new sap.m.Text({
                        text : "{path : 'SystemGroupTypeTarget'}"
                    }), new sap.m.Text({
                        text : "{path : 'TimeDuration'}"
                    }), new sap.m.Text({
                        text : {
                            parts : [ {
                                path : 'applicationContext>/UTC'
                            }, {
                                path : 'TimestampOfEnd'
                            } ],
                            formatter : sap.secmon.ui.commons.Formatter.dateFormatterEx
                        }
                    }), new sap.m.Text({
                        text : {
                            parts : [ {
                                path : 'applicationContext>/UTC'
                            }, {
                                path : 'TimestampOfStart'
                            } ],
                            formatter : sap.secmon.ui.commons.Formatter.dateFormatterEx
                        }
                    }), new sap.m.Text({
                        text : "{path : 'TriggerNameActing'}"
                    }), new sap.m.Text({
                        text : "{path : 'TriggerNameTargeted'}"
                    }), new sap.m.Text({
                        text : "{path : 'TriggerTypeActing'}"
                    }), new sap.m.Text({
                        text : "{path : 'TriggerTypeTargeted'}"
                    }), new sap.m.Text({
                        text : "{path : 'UsernameDomainNameActing'}"
                    }), new sap.m.Text({
                        text : "{path : 'UsernameDomainNameInitiating'}"
                    }), new sap.m.Text({
                        text : "{path : 'UsernameDomainNameTargeted'}"
                    }), new sap.m.Text({
                        text : "{path : 'UsernameDomainNameTargeting'}"
                    }), new sap.m.Text({
                        text : "{path : 'UsernameDomainTypeActing'}"
                    }), new sap.m.Text({
                        text : "{path : 'UsernameDomainTypeInitiating'}"
                    }), new sap.m.Text({
                        text : "{path : 'UsernameDomainTypeTargeted'}"
                    }), new sap.m.Text({
                        text : "{path : 'UsernameDomainTypeTargeting'}"
                    }) ],
                    type : sap.m.ListType.Active
                });
            };

            this.getFilterInputIdsOfFilterBar =
                    function() {
                        return [ "eventNameFilterInput", "eventLogTypeFilterInput", "serviceTransactionNameFilterInput", "serviceProgramNameFilterInput", "serviceInstanceNameFilterInput",
                                "usernameNoRoleFilterInput", "usernameInitiatingFilterInput", "usernameActingFilterInput", "usernameTargetedFilterInput", "usernameTargetingFilterInput",
                                "systemIdNoRoleFilterInput", "systemIdActorFilterInput", "systemTypeActorFilterInput", "systemIdTargetFilterInput", "systemTypeTargetFilterInput",
                                "systemIdInitiatorFilterInput", "systemTypeInitiatorFilterInput", "systemIdIntermediaryFilterInput", "systemTypeIntermediaryFilterInput",
                                "systemIdReporterFilterInput", "systemTypeReporterFilterInput", "eventFilterInput", "networkHostnameActorFilterInput", "networkHostnameInitiatorFilterInput",
                                "networkHostnameIntermediaryFilterInput", "networkHostnameReporterFilterInput", "networkHostnameTargetFilterInput", "networkHostDomainActorFilterInput",
                                "networkHostDomainInitiatorFilterInput", "networkHostDomainIntermediaryFilterInput", "networkHostDomainReporterFilterInput", "networkHostDomainTargetFilterInput",
                                "networkIPAddressActorFilterInput", "networkIPAddressInitiatorFilterInput", "networkIPAddressIntermediaryFilterInput", "networkIPAddressReporterFilterInput",
                                "networkIPAddressTargetFilterInput", "userLogonMethodFilterInput", "technicalGroupIdFilterInput", "technicalLogEntryTypeFilterInput", "technicalNumberFilterInput",
                                "technicalNumberRangeFilterInput", "technicalTimestampOfInsertionFilterInput", "attackNameFilterInput", "attackTypeFilterInput", "correlationIdFilterInput",
                                "correlationSubIdFilterInput", "eventMessageFilterInput", "eventScenarioRoleOfActorFilterInput", "eventScenarioRoleOfInitiatorFilterInput",
                                "eventSeverityCodeFilterInput", "eventSourceIdFilterInput", "eventSourceTypeFilterInput", "genericActionFilterInput", "genericCategoryFilterInput",
                                "genericDeviceTypeFilterInput", "genericExplanationFilterInput", "genericGeolocationCodeActorFilterInput", "genericGeolocationCodeTargetFilterInput",
                                "genericOrderFilterInput", "genericOutcomeFilterInput", "genericOutcomeReasonFilterInput", "genericPathFilterInput", "genericPathPriorFilterInput",
                                "genericPurposeFilterInput", "genericRiskLevelFilterInput", "genericScoreFilterInput", "genericSessionIdFilterInput", "genericURIFilterInput",
                                "networkInterfaceActorFilterInput", "networkInterfaceTargetFilterInput", "networkIPBeforeNATActorFilterInput", "networkIPBeforeNATTargetFilterInput",
                                "networkMACAddressActorFilterInput", "networkMACAddressInitiatorFilterInput", "networkMACAddressIntermediaryFilterInput", "networkMACAddressReporterFilterInput",
                                "networkMACAddressTargetFilterInput", "networkNetworkPrefixActorFilterInput", "networkNetworkPrefixTargetFilterInput", "networkPortActorFilterInput",
                                "networkPortInitiatorFilterInput", "networkPortIntermediaryFilterInput", "networkPortReporterFilterInput", "networkPortTargetFilterInput",
                                "networkPortBeforeNATActorFilterInput", "networkPortBeforeNATTargetFilterInput", "networkProtocolFilterInput", "networkSessionIdFilterInput",
                                "networkSubnetIdActorFilterInput", "networkSubnetActorFilterInput", "networkSubnetCategoryActorFilterInput", "networkSubnetNameActorFilterInput",
                                "networkSubnetLocationActorFilterInput", "networkSubnetIdInitiatorFilterInput", "networkSubnetInitiatorFilterInput", "networkSubnetCategoryInitiatorFilterInput",
                                "networkSubnetNameInitiatorFilterInput", "networkSubnetLocationInitiatorFilterInput", "networkSubnetIdIntermediaryFilterInput", "networkSubnetIntermediaryFilterInput",
                                "networkSubnetCategoryIntermediaryFilterInput", "networkSubnetNameIntermediaryFilterInput", "networkSubnetLocationIntermediaryFilterInput",
                                "networkSubnetIdReporterFilterInput", "networkSubnetReporterFilterInput", "networkSubnetCategoryReporterFilterInput", "networkSubnetNameReporterFilterInput",
                                "networkSubnetLocationReporterFilterInput", "networkSubnetIdTargetFilterInput", "networkSubnetTargetFilterInput", "networkSubnetCategoryTargetFilterInput",
                                "networkSubnetNameTargetFilterInput", "networkSubnetLocationTargetFilterInput", "networkZoneActorFilterInput", "networkZoneTargetFilterInput",
                                "parameterDirectionFilterInput", "parameterDirectionContextFilterInput", "parameterNameFilterInput", "parameterNameContextFilterInput", "parameterDataTypeFilterInput",
                                "parameterDataTypeContextFilterInput", "parameterTypeFilterInput", "parameterTypeContextFilterInput", "parameterValueNumberFilterInput",
                                "parameterValueNumberContextFilterInput", "parameterValueNumberPriorValueFilterInput", "parameterValueStringFilterInput", "parameterValueStringContextFilterInput",
                                "parameterValueStringPriorValueFilterInput", "parameterValueDoubleFilterInput", "parameterValueDoublePriorValueFilterInput", "parameterValueTimestampFilterInput",
                                "parameterValueTimestampPriorValueFilterInput", "privilegeIsGrantableFilterInput", "privilegeNameFilterInput", "privilegeTypeFilterInput",
                                "privilegeGranteeNameFilterInput", "privilegeGranteeTypeFilterInput", "resourceContainerNameFilterInput", "resourceContainerTypeFilterInput",
                                "resourceContentFilterInput", "resourceContentTypeFilterInput", "resourceCountFilterInput", "resourceNameFilterInput", "resourceNamePriorFilterInput",
                                "resourceRequestSizeFilterInput", "resourceResponseSizeFilterInput", "resourceSizeFilterInput", "resourceTypeFilterInput", "resourceSumCriteriaFilterInput",
                                "resourceSumOverTimeFilterInput", "resourceUnitsOfMeasureFilterInput", "serviceAccessNameFilterInput", "serviceFunctionNameFilterInput", "serviceReferrerFilterInput",
                                "serviceRequestLineFilterInput", "serviceTypeFilterInput", "serviceVersionFilterInput", "serviceApplicationNameFilterInput", "serviceExecutableNameFilterInput",
                                "serviceExecutableTypeFilterInput", "serviceOutcomeFilterInput", "servicePartIdFilterInput", "serviceProcessIdFilterInput", "serviceUserAgentFilterInput",
                                "serviceWorkflowNameFilterInput", "systemGroupIdActorFilterInput", "systemGroupIdInitiatorFilterInput", "systemGroupIdIntermediaryFilterInput",
                                "systemGroupIdReporterFilterInput", "systemGroupIdTargetFilterInput", "systemGroupTypeActorFilterInput", "systemGroupTypeInitiatorFilterInput",
                                "systemGroupTypeIntermediaryFilterInput", "systemGroupTypeReporterFilterInput", "systemGroupTypeTargetFilterInput", "timeDurationFilterInput",
                                "timestampOfEndFilterInput", "timestampOfStartFilterInput", "triggerNameActingFilterInput", "triggerNameTargetedFilterInput", "triggerTypeActingFilterInput",
                                "triggerTypeTargetedFilterInput", "usernameDomainNameActingFilterInput", "usernameDomainNameInitiatingFilterInput", "usernameDomainNameTargetedFilterInput",
                                "usernameDomainNameTargetingFilterInput", "usernameDomainTypeActingFilterInput", "usernameDomainTypeInitiatingFilterInput", "usernameDomainTypeTargetedFilterInput",
                                "usernameDomainTypeTargetingFilterInput", "technicalEventNameFilterInput", "eventNamespaceFilterInput", "originalDataFilterInput" ];

                    };
        };