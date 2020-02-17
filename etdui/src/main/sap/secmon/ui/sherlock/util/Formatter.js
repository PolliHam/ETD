$.sap.declare("sap.secmon.ui.sherlock.util.Formatter");
/**
 * 
 */
sap.secmon.ui.sherlock.util.Formatter = {
    reasonFormatter : function(text1, text2, text3, reason) {
        var reasonText;
        switch (reason) {
        case 1:
            reasonText = text1;
            break;
        case 2:
            reasonText = text2;
            break;
        case 3:
            reasonText = text3;
            break;
        default:
            reasonText = "";
            break;
        }
        return reasonText;
    }
};
