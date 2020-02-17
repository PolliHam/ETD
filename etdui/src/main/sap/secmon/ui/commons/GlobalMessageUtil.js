
var ADependencies = [ "sap/m/MessageBox", "sap/m/MessageToast", "sap/secmon/ui/commons/TextUtils" ];

sap.ui.define(ADependencies, function(MessageBox, MessageToast, TextUtils) {
    "use strict";

    /**
     * A utility to present messages to user.
     */
    sap.secmon.ui.commons.GlobalMessageUtil = function() {
        if (sap.secmon.ui.commons.GlobalMessageUtil.prototype.singletoninstance) {
            return sap.secmon.ui.commons.GlobalMessageUtil.prototype.singletoninstance;
        }
        sap.secmon.ui.commons.GlobalMessageUtil.prototype.singletoninstance = this;

        /**
         * Error title.
         */
        sap.secmon.ui.commons.GlobalMessageUtil.prototype.ERROR_TITLE = TextUtils.getText("/sap/secmon/ui/CommonUIText.hdbtextbundle", "Error_TIT");

        /**
         * Display a message according to UI guidelines: https://ux.wdf.sap.corp/fiori-design-web/concept/messaging/
         * <li>- a success message is shown as MessageToast (Caution: the longText is not displayed)</li>
         * <li>- infos and warnings are added to a MessagePopover. The corresponding button shows number of messages.</li>
         * <li>- errors are shown in a messagebox </li>
         * The display options can be overridden with flag asynchronous.
         * 
         * @param type
         *            a value of enumeration sap.ui.core.MessageType
         * @param shortText
         *            a short text, it is always displayed
         * @param longText
         *            optional. Only displayed in MessagePopover
         * @param asynchronous
         *            If asynchronous the message is stored in the global sap.ui.core.message.MessageManager. The user needs to click on the globalMessageButton to see the message. Defaults to true
         *            for type = "Information" (In rare cases, you might want to use a message toast. Set asnychronous=false). Defaults to true for "Warning" (In rare cases, you might want to use a
         *            message box. Set asynchronous=false). Defaults to false for "Success" (here a message toast is preferred) and "Error" (for a serious error, a message box is more suitable).
         */
        this.addMessage = function(type, shortText, longText, asynchronous) {
            function addToMessageManager() {
                var oMessageManager = sap.ui.getCore().getMessageManager();
                var oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
                oMessageManager.registerMessageProcessor(oMessageProcessor);
                oMessageManager.addMessages(new sap.ui.core.message.Message({
                    message : shortText,
                    description : longText,
                    type : type,
                    processor : oMessageProcessor
                }));
            }

            switch (type) {
            case sap.ui.core.MessageType.Success:
                if (asynchronous === true) {
                    addToMessageManager();
                } else {
                    MessageToast.show(shortText);
                }
                break;
            case sap.ui.core.MessageType.Information:
                if (asynchronous === false) {
                    MessageToast.show(shortText);
                } else {
                    addToMessageManager();
                }
                break;
            case sap.ui.core.MessageType.Warning:
                if (asynchronous === false) {
                    if (longText && longText.length > 0) {
                        MessageBox.alert(longText);
                    } else {
                        MessageBox.alert(shortText);
                    }
                } else {
                    addToMessageManager();
                }
                break;
            case sap.ui.core.MessageType.Error:
                if (asynchronous === true) {
                    addToMessageManager();
                } else {
                    if (longText && longText.length > 0) {
                        MessageBox.show(longText, {
                            title : this.ERROR_TITLE,
                            icon : MessageBox.Icon.ERROR,
                            actions : MessageBox.Action.CLOSE
                        });
                    } else {
                        MessageBox.show(shortText, {
                            title : this.ERROR_TITLE,
                            icon : MessageBox.Icon.ERROR,
                            actions : MessageBox.Action.CLOSE
                        });
                    }
                }
                break;
            default:
                addToMessageManager();
            }

        };

    };

    return sap.secmon.ui.commons.GlobalMessageUtil;
});