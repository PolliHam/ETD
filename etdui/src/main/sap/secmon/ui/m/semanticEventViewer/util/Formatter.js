jQuery.sap.declare("sap.secmon.ui.m.semanticEventViewer.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");

/**
 * Make some formatters globally available.
 */
sap.secmon.ui.m.semanticEventViewer.util.Formatter =
        (function() {

            var REGEX_SYSTEMACTOR = /\${SystemTypeActor}\/\${SystemIdActor}/;
            var REGEX_SYSTEMINITIATOR = /\${SystemTypeInitiator}\/\${SystemIdInitiator}/;
            var REGEX_SYSTEMINTERMEDIARY = /\${SystemTypeIntermediary}\/\${SystemIdIntermediary}/;
            var REGEX_SYSTEMREPORTER = /\${SystemTypeReporter}\/\${SystemIdReporter}/;
            var REGEX_SYSTEMTARGET = /\${SystemTypeTarget}\/\${SystemIdTarget}/;
            var REGEX_RESOURCENAME = /\${ResourceName}/;
            var REGEX_SLASH = /\//;
            var ENCODED_SLASH = "%252F";
            var ETDPATTERN = "ETD Pattern";
            var ETDANOMALYD = "ETD Anomaly Detection";

            var sLocale = sap.ui.getCore().getConfiguration().getLanguage();
            var oTextBundle = jQuery.sap.resources({
                url : "/sap/secmon/ui/m/commons/semanticEvents/i18n/UIText.hdbtextbundle",
                locale : sLocale
            });

            return {

                userFormatter : function(user, system, systemType, domainname, domainType) {
                    if (!user) {
                        return "";
                    }
                    if (system) {
                        return user + " " + system + addAdditionalInfo(systemType);
                    } else {
                        return user + " " + (domainname || "") + addAdditionalInfo(domainType);
                    }

                },
                parameterFormatter : function(utc, double, number, string, timestamp, type) {
                    if (timestamp) {
                        return sap.secmon.ui.commons.Formatter.dateFormatterEx(utc, timestamp) + " (" + type + ")";

                    }
                    if (!(double || number || string || type)) {
                        return "";
                    }
                    return (double ? double.toString() : "") + (number ? number.toString() : "") + (string || "") + " (" + (type || "") + ")";
                },
                visibleFormatter : function() {
                    if (arguments.length === 0) {
                        return false;
                    } else {
                        return Array.prototype.some.call(arguments, function(x) {
                            if (x) {
                                return true;
                            }
                        });
                    }
                },
                systemFormatter : function(systemId, systemType) {
                    return (systemId || "") + addAdditionalInfo(systemType);
                },

                sentenceTextFormatter : function(sentenceReferences, userPseudonymData) {
                    var that = this;
                    // Try to avoid calling formatter each time
                    if (!Array.prototype.some.call(arguments, function(argument) {
                        return (argument !== undefined && argument !== null);
                    })) {
                        return "";
                    }
                    
                    var allSentences = [];
                    if (sentenceReferences && userPseudonymData && this.getBindingContext) {
                        var context = this.getBindingContext();
                        var model = this.getModel();
                        var sentences = getSentences(sentenceReferences, context);
                        var allData = model.getProperty(context.getPath());
                        var index = 0;
                        var currentSentence;
                        for (index in sentences) {

                            sentences[index].some(alternativeHandler);
                        }
                        return allSentences.join(" ");
                    }

                    function alternativeHandler(alternative) {
                        var pseudonym = userPseudonymData;
                        if (alternative.attributes
                                .every(function(attribute) {
                                    return (allData.hasOwnProperty(attribute.attributeName) && allData[attribute.attributeName] || 
                                            (pseudonym.hasOwnProperty(attribute.attributeName) && pseudonym[attribute.attributeName]));
                                })) {
                            currentSentence = sap.secmon.ui.commons.Formatter.knowledgebaseFormatter.call(that, alternative.DisplayKey, alternative.sentence);
                            var index = 0;
                            alternative.attributes.forEach(function(attribute) {
                                var data = allData.hasOwnProperty(attribute.attributeName) ? allData[attribute.attributeName] : pseudonym[attribute.attributeName];
                                if (currentSentence.search(REGEX_RESOURCENAME) > 0 && attribute.attributeName === "ResourceName" &&
                                        (allData.hasOwnProperty("TriggerTypeActing") && (allData.TriggerTypeActing === ETDPATTERN || allData.TriggerTypeActing === ETDANOMALYD))) {
                                    currentSentence = currentSentence.replace(attribute.attributeRegex, "{" + index + "}");
                                    index++;
                                } else if (currentSentence.search(REGEX_SYSTEMACTOR) > 0 && attribute.attributeName === "SystemTypeActor") {
                                    currentSentence = currentSentence.replace(REGEX_SYSTEMACTOR, "{" + index + "}");
                                    index++;
                                } else if (currentSentence.search(REGEX_SYSTEMINITIATOR) > 0 && attribute.attributeName === "SystemTypeInitiator") {
                                    currentSentence = currentSentence.replace(REGEX_SYSTEMINITIATOR, "{" + index + "}");
                                    index++;
                                } else if (currentSentence.search(REGEX_SYSTEMINTERMEDIARY) > 0 && attribute.attributeName === "SystemTypeIntermediary") {
                                    currentSentence = currentSentence.replace(REGEX_SYSTEMINTERMEDIARY, "{" + index + "}");
                                    index++;
                                } else if (currentSentence.search(REGEX_SYSTEMREPORTER) > 0 && attribute.attributeName === "SystemTypeReporter") {
                                    currentSentence = currentSentence.replace(REGEX_SYSTEMREPORTER, "{" + index + "}");
                                    index++;
                                } else if (currentSentence.search(REGEX_SYSTEMTARGET) > 0 && attribute.attributeName === "SystemTypeTarget") {
                                    currentSentence = currentSentence.replace(REGEX_SYSTEMTARGET, "{" + index + "}");
                                    index++;
                                } else {
                                    currentSentence = currentSentence.replace(attribute.attributeRegex, data);
                                }
                            });
                            allSentences.push(currentSentence);
                            return true;
                        }
                    }                    
                    return "";
                },

                linkFormatter : function(sentenceReferences, userPseudonymData) {
                    var that = this;
                    // Try to avoid calling formatter each time
                    if (!Array.prototype.some.call(arguments, function(argument) {
                        return (argument !== undefined && argument !== null);
                    })) {
                        return [];
                    } 
                                       
                    if (sentenceReferences && userPseudonymData && this.getBindingContext) {
                        var context = this.getBindingContext();
                        var model = this.getModel();
                        var sentences = getSentences(sentenceReferences, context);
                        var allData = model.getProperty(context.getPath());
                        var index = 0;
                        var currentSentence;
                        var links = [];
                        for (index in sentences) {
                            sentences[index].some(alternativeHandler);
                        }
                        return links;
                    }

                    function alternativeHandler(alternative) {
                        var pseudonym = userPseudonymData;
                        if (alternative.attributes
                                .every(function(attribute) {
                                    return (allData.hasOwnProperty(attribute.attributeName) && allData[attribute.attributeName] || 
                                            (pseudonym.hasOwnProperty(attribute.attributeName) && pseudonym[attribute.attributeName]));
                                })) {
                            currentSentence = sap.secmon.ui.commons.Formatter.knowledgebaseFormatter.call(that, alternative.DisplayKey, alternative.sentence);
                            var launchpaduri = "/sap/hana/uis/clients/ushell-app/shells/fiori/FioriLaunchpad.html?siteId=sap.secmon.ui.mobile.launchpad|ETDLaunchpad";
                            var link = {};
                            alternative.attributes
                                    .forEach(function(attribute) {
                                        if (currentSentence.search(REGEX_RESOURCENAME) > 0 &&
                                                attribute.attributeName === "ResourceName" &&
                                                (allData.hasOwnProperty("TriggerNameActing") && (allData.hasOwnProperty("TriggerTypeActing") && 
                                                        (allData.TriggerTypeActing === ETDPATTERN || allData.TriggerTypeActing === ETDANOMALYD)))) {
                                            if (allData.TriggerTypeActing === "ETD Pattern") {
                                                link = {
                                                    Text : allData.ResourceName,
                                                    Url : launchpaduri + "#Patterns-show&/pattern/" + allData.TriggerNameActing
                                                };
                                            } else {
                                                link = {
                                                    Text : allData.ResourceName,
                                                    Url : launchpaduri + "#AnomalyDetection-show&/AnomalyDetection/AnomalyDetectionData(X'" + allData.TriggerNameActing + "')"
                                                };
                                            }
                                            links.push(link);
                                        } else if ((currentSentence.search(REGEX_SYSTEMACTOR) > 0 && attribute.attributeName === "SystemTypeActor") ||
                                                (currentSentence.search(REGEX_SYSTEMINITIATOR) > 0 && attribute.attributeName === "SystemTypeInitiator") ||
                                                (currentSentence.search(REGEX_SYSTEMINTERMEDIARY) > 0 && attribute.attributeName === "SystemTypeIntermediary") ||
                                                (currentSentence.search(REGEX_SYSTEMREPORTER) > 0 && attribute.attributeName === "SystemTypeReporter") ||
                                                (currentSentence.search(REGEX_SYSTEMTARGET) > 0 && attribute.attributeName === "SystemTypeTarget")) {
                                            var system, systemEncoded, type;
                                            if (attribute.attributeName === "SystemTypeActor") {
                                                systemEncoded = allData.SystemIdActor;
                                                if (allData.SystemIdActor.search(REGEX_SLASH) > 0) {
                                                    systemEncoded = allData.SystemIdActor.replace(REGEX_SLASH, ENCODED_SLASH);
                                                }
                                                system = allData.SystemIdActor;
                                                type = allData.SystemTypeActor;
                                            } else if (attribute.attributeName === "SystemTypeInitiator") {
                                                systemEncoded = allData.SystemIdInitiator;
                                                if (allData.SystemIdActor.search(REGEX_SLASH) > 0) {
                                                    systemEncoded = allData.SystemIdInitiator.replace(REGEX_SLASH, ENCODED_SLASH);
                                                }
                                                system = allData.SystemIdInitiator;
                                                type = allData.SystemTypeInitiator;
                                            } else if (attribute.attributeName === "SystemTypeIntermediary") {
                                                systemEncoded = allData.SystemIdIntermediary;
                                                if (allData.SystemIdActor.search(REGEX_SLASH) > 0) {
                                                    systemEncoded = allData.SystemIdIntermediary.replace(REGEX_SLASH, ENCODED_SLASH);
                                                }
                                                system = allData.SystemIdIntermediary;
                                                type = allData.SystemTypeIntermediary;
                                            } else if (attribute.attributeName === "SystemTypeReporter") {

                                                systemEncoded = allData.SystemIdReporter;
                                                if (allData.SystemIdActor.search(REGEX_SLASH) > 0) {
                                                    systemEncoded = allData.SystemIdReporter.replace(REGEX_SLASH, ENCODED_SLASH);
                                                }
                                                system = allData.SystemIdReporter;
                                                type = allData.SystemTypeReporter;
                                            } else if (attribute.attributeName === "SystemTypeTarget") {
                                                systemEncoded = allData.SystemIdTarget;
                                                if (allData.SystemIdActor.search(REGEX_SLASH) > 0) {
                                                    systemEncoded = allData.SystemIdTarget.replace(REGEX_SLASH, ENCODED_SLASH);
                                                }
                                                system = allData.SystemIdTarget;
                                                type = allData.SystemTypeTarget;
                                            }

                                            link = {
                                                Text : type + "/" + system,
                                                Url : launchpaduri + "#System-show?system=" + systemEncoded + "&type=" + type
                                            };
                                            links.push(link);
                                        }
                                    });
                            return true;
                        }
                    }                    
                },

                anomalyLinkFormatter : function(correlationId, technicalLogEntryType) {
                    return renderableAsAnomalyLink(correlationId, technicalLogEntryType);
                },
                anomalyTextFormatter : function(correlationId, technicalLogEntryType) {
                    return !renderableAsAnomalyLink(correlationId, technicalLogEntryType);
                },
                EventNameLinkTextFormatter : function(eventName, displayKey) {
                    var text = sap.secmon.ui.commons.Formatter.knowledgebaseFormatter.call(this, displayKey, eventName);
                    return text + (text ? " " : "") + oTextBundle.getText("SE_DetailsLab");
                }
            };

            function renderableAsAnomalyLink(correlationId, technicalLogEntryType) {
                if (correlationId && technicalLogEntryType === 'INDICATOR_ANOMALY') {
                    return true;
                }
                return false;
            }

            function addAdditionalInfo(info) {
                if (info) {
                    return "(" + info + ")";
                }
                return "";
            }

            function getSentences(x, context) {
                var sentences = [];
                if (x.results) {
                    sentences = x.results;
                } else {
                    var model = context.getModel();
                    for (var i = 0; i < x.length; i++) {
                        sentences.push(model.getProperty("/" + x[i]));
                    }
                }
                sentences.sort(function(a, b) {
                    return (a.number - b.number) === 0 ? a.alternative - b.alternative : a.number - b.number;
                });

                return sentences.reduce(function(prev, current) {
                    var sentenceObject = extractAttributes(current);
                    if (prev.hasOwnProperty(current.number)) {
                        prev[current.number].push(sentenceObject); 
                    } else {
                        prev[current.number] = [ sentenceObject ];
                    }
                    return prev;
                }, {});

            }

            function extractAttributes(sentence) {
                var sentenceObject = {
                    number : sentence.number,
                    alternative : sentence.alternative,
                    sentence : sentence.sentence,
                    attributes : [],
                    DisplayKey : sentence.DisplayKey
                };
                var extractRegex = /\$\{(\w+)\}/g;
                var matchObject;
                var match = extractRegex.exec(sentence.sentence);
                while (match) {
                    matchObject = {
                        attributeName : match[1],
                        attributeRegex : new RegExp(match[0].replace(/(\$|{|})/g, '\\$1'), 'g')
                    };
                    sentenceObject.attributes.push(matchObject);
                    match = extractRegex.exec(sentence.sentence);
                }

                return sentenceObject;
            }
        })();