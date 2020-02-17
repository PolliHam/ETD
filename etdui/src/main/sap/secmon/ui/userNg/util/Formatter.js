jQuery.sap.declare("sap.secmon.ui.userNg.util.Formatter");

sap.secmon.ui.userNg.util.Formatter = {
    nameFormatter : function(firstName, middleName, lastName) {
        return [].reduce.call(arguments, function(x, current) {
            if (current && current !== "") {
                x.push(current);
            }
            return x;
        }, []).join(" ");
    },
    systemFormatter : function(system, systemType) {
        if (systemType) {
            return jQuery.sap.formatMessage('{0} ({1})', system, systemType);
        } else {
            return system;
        }
    },
    tableModeFormatter : function(sSelectedTab) {
        return sSelectedTab === "reverse" ? "MultiSelect" : "None";
    }
};
