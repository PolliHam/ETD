jQuery.sap.require("sap.secmon.ui.m.commons.controls.MessagePopover");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.declare("sap.secmon.ui.commons.controls.GlobalMessageButton");

/**
 * Constructor for a new GlobalMessageButton. The button listens to the global
 * sap.ui.core.MessageManager. If there are no messages, the button is
 * invisible. If there are messages, the buttons shows a corresponding icon
 * (info, warning, error) and the number of messages of the highest severity.
 * 
 * @class
 */
sap.m.Button.extend("sap.secmon.ui.commons.controls.GlobalMessageButton", {

    metadata : {
        aggregations : {
            messagePopover : {
                type : "sap.secmon.ui.m.commons.controls.MessagePopover",
                multiple : false,
                visibility : "hidden"
            }
        }
    },

    init : function() {
        if (sap.m.Button.prototype.init) {
            sap.m.Button.prototype.init.apply(this, arguments);
        }

        if (!sap.secmon.ui.commons.controls.GlobalMessageButton.prototype.textTemplate) {
            sap.secmon.ui.commons.controls.GlobalMessageButton.prototype.textTemplate = sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/CommonUIText.hdbtextbundle", "Notifications_LBL");
        }

        var messageModel = sap.ui.getCore().getMessageManager().getMessageModel();
        var oMessageTemplate = new sap.m.MessagePopoverItem({
            type : '{message>type}',
            title : '{message>message}',
            description : '{message>description}'
        });
        var messagePopover = new sap.secmon.ui.m.commons.controls.MessagePopover({
            items : {
                path : 'message>/',
                template : oMessageTemplate
            },
            models : {
                "message" : messageModel
            }
        });
        this.setAggregation("messagePopover", messagePopover);

        var that = this;
        this.setVisible(false);
        var oBinding = messagePopover.getBinding("items");
        oBinding.attachChange(function(oEvent) {
            var icon = "";
            var count = 0, errorCount = 0, warningCount = 0, infoCount = 0;
            var visible = false;
            var messages = messageModel.getData();
            messages.forEach(function(message) {
                switch (message.type) {
                case sap.ui.core.MessageType.Error:
                    errorCount++;
                    break;
                case sap.ui.core.MessageType.Warning:
                    warningCount++;
                    break;
                default:
                    infoCount++;
                }
            });
            if (errorCount > 0) {
                icon = "sap-icon://message-error";
                visible = true;
            } else if (warningCount > 0) {
                icon = "sap-icon://message-warning";
                visible = true;
            } else if (infoCount > 0) {
                icon = "sap-icon://message-information";
                visible = true;
            } else {
                visible = false;
            }
            that.setVisible(visible);
            count = errorCount + warningCount + infoCount;
            var text = sap.secmon.ui.commons.Formatter.i18nText(sap.secmon.ui.commons.controls.GlobalMessageButton.prototype.textTemplate, count);
            that.setText(text);
            that.setIcon(icon);
        });

        this.attachPress(function(oEvent) {
            this.getAggregation("messagePopover").openBy(oEvent.getSource());
        });
    },

    renderer : {
    // use parent renderer
    }
});
