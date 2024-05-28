const db = require("../config/connection.js");
const uuid = require("uuidv4");
const jwt = require("jsonwebtoken");
const { hashPassword, validatePassword } = require("../middleware/hashpass.js");
const TRANS = require("../config/transaction.js");
const crud = require("../helper/crudquery.js");
const moment = require("moment");

const User = {
    showAll: async () => {
        const client = await db.connect();
        try {
            const row = await client.query(`
            SELECT us.user_id as id, us.fullname, us.username, us.email, sec.user_group_name, us.role, 
                TO_CHAR(us.created_at, 'mm-dd-yyyy') as created_at, 
                TO_CHAR(us.expired_date, 'mm-dd-yyyy') as expired_date,
                us.is_active
                FROM mst_user us
                LEFT JOIN (SELECT DISTINCT user_group_name, user_group_id from mst_page_access) sec on us.user_group = sec.user_group_id
UNION
SELECT us.mgr_id as id, us.fullname, us.username, us.email, sec.user_group_name, us.role, 
                TO_CHAR(us.created_at, 'mm-dd-yyyy') as created_at, 
                TO_CHAR(us.expired_date, 'mm-dd-yyyy') as expired_date,
                us.is_active
                FROM mst_mgr us
				LEFT JOIN (SELECT DISTINCT user_group_name, user_group_id from mst_page_access) sec on us.user_group = sec.user_group_id`);
            return {
                count: row.rowCount,
                data: row.rows,
            };
        } catch (error) {
            console.error(error);
        } finally {
            client.release();
        }
    },
    createUser: async params => {
        const uidExist = params.user_id;
        let pass;
        let query, val;
        let submitState = "";
        if (uidExist != "") {
            submitState = "update";
        } else {
            submitState = "insert";
        }
        const client = await db.connect();
        client.query(TRANS.BEGIN);
        if (params.hasOwnProperty("password")) {
            pass = await hashPassword(params.password);
        }
        const token = jwt.sign(
            { username: params.username },
            process.env.TOKEN_KEY,
            { expiresIn: "1d" }
        );
        const currentdate = new Date().toLocaleDateString();
        const startDate = params.createddate;
        const validDate = params.expireddate;
        const user_id = uidExist != "" ? uidExist : uuid.uuid();
        const fullname = params.fullname;
        const username = params.username;
        const email = params.email;
        const userGroup = params.usergroup;
        const mgr_id = params.mgr_id;
        const role = params.role;
        let userSubmit = {
            fullname: fullname,
            username: username,
            email: email,
            role: role,
            created_at: moment(startDate).format("YYYY-MM-DD"),
            expired_date: moment(validDate).format("YYYY-MM-DD"),
            updated_at: moment(currentdate).format("YYYY-MM-DD"),
            is_active: true,
            user_group: userGroup,
            user_id: user_id,
            mgr_id: mgr_id,
            token: token,
        };
        if (params.hasOwnProperty("password")) {
            userSubmit.password = pass;
        }
        if (submitState == "insert") {
            [query, val] = crud.insertItem("mst_user", userSubmit, "username");
        } else {
            [query, val] = crud.updateItem(
                "mst_user",
                userSubmit,
                {
                    user_id: uidExist,
                },
                "username"
            );
        }

        try {
            const insertUser = await client.query(query, val);
            await client.query(TRANS.COMMIT);
            return { name: insertUser.rows[0].username };
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            client.release();
        }
    },

    showUserData: async idUser => {
        const client = await db.connect();
        const q = `SELECT * FROM (SELECT FULLNAME,
            USERNAME,
            PASSWORD,
            ROLE,
            USER_GROUP AS USERGROUP,
            USER_ID,
            MGR_ID,
            CREATED_AT AS DATECREATED,
            EXPIRED_DATE AS EXPIREDDATE ,
            EMAIL
        FROM MST_USER
        UNION
        SELECT FULLNAME,
            USERNAME,
            PASSWORD,
            ROLE,
            USER_GROUP AS USERGROUP,
            MGR_ID AS USER_ID,
            '' AS MGR_ID,
            CREATED_AT AS DATECREATED,
            EXPIRED_DATE AS EXPIREDDATE ,
            EMAIL
        FROM MST_MGR) AS userdata where user_id = '${idUser}'`;
        try {
            const showUserbyId = await client.query(q);
            return {
                data: showUserbyId.rows[0],
            };
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            client.release();
        }
    },

    createManager: async params => {
        const client = await db.connect();
        const uidExist = params.user_id;
        let pass = "";
        let query, val;
        if (uidExist != "") {
            submitState = "update";
        } else {
            submitState = "insert";
        }
        if (params.hasOwnProperty("password")) {
            pass = await hashPassword(params.password);
        }
        const token = jwt.sign(
            { username: params.username },
            process.env.TOKEN_KEY,
            { expiresIn: "1d" }
        );
        const currentdate = new Date().toLocaleDateString();
        const startDate = params.createddate;
        const validDate = params.expireddate;
        const user_id = uuid.uuid();
        const fullname = params.fullname;
        const username = params.username;
        const email = params.email;
        const userGroup = params.usergroup;
        const department = params.department;
        const role = params.role;
        const userSubmit = {
            fullname: fullname,
            username: username,
            email: email,
            role: role,
            created_at: moment(startDate).format("YYYY-MM-DD"),
            expired_date: moment(validDate).format("YYYY-MM-DD"),
            updated_at: moment(currentdate).format("YYYY-MM-DD"),
            is_active: true,
            department: department,
            user_group: userGroup,
            mgr_id: user_id,
            token: token,
        };
        if (params.hasOwnProperty("password")) {
            userSubmit.password = pass;
        }
        if (submitState == "insert") {
            [query, val] = crud.insertItem("mst_mgr", userSubmit, "username");
        } else {
            [query, val] = crud.updateItem(
                "mst_mgr",
                userSubmit,
                {
                    mgr_id: uidExist,
                },
                "username"
            );
        }
        try {
            const insertUserMgr = await client.query(query, val);
            return { name: insertUserMgr.rows[0].username };
        } catch (error) {
            throw error.message;
        } finally {
            client.release();
        }
    },

    checkUserExist: async (user_email, username) => {
        const connect = await db.connect();
        try {
            let status = true;
            const messages = [];
            const checkExistemaila = await connect.query(
                `select user_id from mst_user where email = '${user_email}' `
            );
            const checkExistemailb = await connect.query(
                `select user_id from mst_mgr where email = '${user_email}' `
            );
            const checkExistUnamea = await connect.query(
                `select user_id from mst_user where username = '${username}' `
            );
            const checkExistUnameb = await connect.query(
                `select user_id from mst_mgr where username = '${username}' `
            );
            if (
                checkExistemaila.rowCount > 0 ||
                checkExistemailb.rowCount > 0
            ) {
                messages.push("Email already exist");
                status = false;
            }
            if (
                checkExistUnamea.rowCount > 0 ||
                checkExistUnameb.rowCount > 0
            ) {
                messages.push("Username already exist");
                status = false;
            }
            if (status) {
                return {
                    status: true,
                };
            } else {
                return {
                    status: false,
                    message: messages,
                };
            }
        } catch (error) {
            return {
                status: false,
                error: error.message,
            };
        } finally {
            connect.release();
        }
    },
    loginUser: async ({ username, password }) => {
        const client = await db.connect();
        try {
            const userData = await client.query(
                `SELECT * FROM 
                (SELECT USERNAME,
                    PASSWORD,
                    FULLNAME,
                    ROLE,
                    USER_GROUP,
                    USER_ID,
                    EMAIL,
                    IS_ACTIVE
                FROM MST_USER
                UNION
                SELECT USERNAME,
                    PASSWORD,
                    FULLNAME,
                    ROLE,
                    USER_GROUP,
                    MGR_ID AS USER_ID,
                    EMAIL,
                    IS_ACTIVE
                FROM MST_MGR) AS user_vms
                where USERNAME = '${username}'`
            );
            if (userData.rows.length === 0) {
                throw new Error("User not found");
            }
            const userGroup = userData.rows[0].user_group;
            const getAuthorization = await client.query(`
            SELECT 
                            PG.MENU_ID AS "id",
                            PG.PAGE,
                            case
                                when acs.fcreate then acs.fcreate
                                else false 
                            end
                            as "fcreate",
                            case
                                when acs.fread then acs.fread
                                else false 
                            end
                            as "fread",
                            case
                                when acs.fupdate then acs.fupdate
                                else false 
                            end
                            as "fupdate",
                            case
                                when acs.fdelete then acs.fdelete
                                else false
                            end
                            as "fdelete"
                            FROM MST_PAGE PG
                            LEFT JOIN 
                            MST_PAGE_ACCESS 
                            ACS ON ACS.PAGE_ID = PG.MENU_ID AND ACS.user_group_id = '${userGroup}'
                        order by PG.parent_id asc, is_parent asc
            `);
            let authPerm = {};
            getAuthorization.rows.map(item => {
                authPerm[item.page] = {
                    create: item.fcreate,
                    read: item.fread,
                    update: item.fupdate,
                    delete: item.fdelete,
                };
            });
            if (!userData.rows[0].is_active) {
                throw new Error("User is inactive");
            }
            const hashed = userData.rows[0].password;
            const valid = await validatePassword({ password, hashed });
            if (valid === false) {
                throw new Error("Password false");
            }
            const resdata = userData.rows[0];
            accessToken = jwt.sign(
                {
                    id: resdata.user_id,
                    username: resdata.username,
                    email: resdata.email,
                },
                process.env.TOKEN_KEY,
                { expiresIn: "30s" }
            );
            refreshToken = jwt.sign(
                {
                    id: resdata.user_id,
                },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "6h",
                }
            );
            await client.query(TRANS.BEGIN);
            let qUpRef = "";
            if (resdata.role === "MGR") {
                qUpRef = `UPDATE MST_MGR set token = '${refreshToken}' where mgr_id = '${resdata.user_id}'`;
            } else {
                qUpRef = `UPDATE MST_USER SET token = '${refreshToken}' where user_id ='${resdata.user_id}'`;
            }
            await client.query(qUpRef);
            await client.query(TRANS.COMMIT);
            return {
                fullname: resdata.fullname,
                username: resdata.username,
                user_id: resdata.user_id,
                email: resdata.email,
                role: resdata.role,
                accessToken: accessToken,
                refreshToken: refreshToken,
                permission: authPerm,
                groupid: userGroup,
            };
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            console.error(error);
            throw error.message;
        } finally {
            client.release();
        }
    },

    getAuthorization: async userGroup => {
        const client = await db.connect();
        try {
            const getAuthorization = await client.query(`
            SELECT 
                            PG.MENU_ID AS "id",
                            PG.PAGE,
                            case
                                when acs.fcreate then acs.fcreate
                                else false 
                            end
                            as "fcreate",
                            case
                                when acs.fread then acs.fread
                                else false 
                            end
                            as "fread",
                            case
                                when acs.fupdate then acs.fupdate
                                else false 
                            end
                            as "fupdate",
                            case
                                when acs.fdelete then acs.fdelete
                                else false
                            end
                            as "fdelete"
                            FROM MST_PAGE PG
                            LEFT JOIN 
                            MST_PAGE_ACCESS 
                            ACS ON ACS.PAGE_ID = PG.MENU_ID AND ACS.user_group_id = '${userGroup}'
                        order by PG.parent_id asc, is_parent asc
            `);
            let authPerm = {};
            getAuthorization.rows.map(item => {
                authPerm[item.page] = {
                    create: item.fcreate,
                    read: item.fread,
                    update: item.fupdate,
                    delete: item.fdelete,
                };
            });
            return authPerm;
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            client.release();
        }
    },

    showExistSecGrp: async () => {
        const client = await db.connect();
        try {
            const q = `select distinct 
                        user_group_name, 
                        user_group_id, 
                        TO_CHAR(created_at, 'mm/dd/yyyy') as createddate
                        from mst_page_access`;
            const userGroups = await client.query(q);
            return {
                count: userGroups.rowCount,
                data: userGroups.rows,
            };
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    },

    showSecurityGroup: async group_id => {
        const client = await db.connect();
        try {
            let secName = "";
            if (group_id !== "") {
                const secNameq = `
                                SELECT 
                                    distinct user_group_name
                                from
                                    mst_page_access where user_group_id = '${group_id}' ;
                `;
                const getname = await client.query(secNameq);
                secName = getname.rows[0].user_group_name;
            }
            const secMtxq = `SELECT 
                                PG.MENU_ID AS "id",
                                PG.PAGE,
                                case
                                    when acs.fcreate then acs.fcreate
                                    else false 
                                end
                                as "fcreate",
                                case
                                    when acs.fread then acs.fread
                                    else false 
                                end
                                as "fread",
                                case
                                    when acs.fupdate then acs.fupdate
                                    else false 
                                end
                                as "fupdate",
                                case
                                    when acs.fdelete then acs.fdelete
                                    else false
                                end
                                as "fdelete"
                                FROM MST_PAGE PG
                                LEFT JOIN 
                                MST_PAGE_ACCESS 
                                ACS ON ACS.PAGE_ID = PG.MENU_ID AND ACS.user_group_id = '${group_id}'
                            order by PG.parent_id asc, is_parent asc
                            `;
            const secMtx = await client.query(secMtxq);
            return {
                name: secName,
                count: secMtx.rowCount,
                data: secMtx.rows,
            };
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    },

    submitSecurityGroup: async (groupname, groupid, accessmtx) => {
        const connect = await db.connect();
        try {
            let group_id = groupid;
            await connect.query(TRANS.BEGIN);
            if (group_id != "") {
                await connect.query(
                    `delete from mst_page_access where user_group_id = '${group_id}' ;`
                );
            }
            if (group_id == "") {
                group_id = uuid.uuid();
            }
            const promisesSubmit = accessmtx.map(item => {
                const insertedItem = {
                    user_group_id: group_id,
                    user_group_name: groupname,
                    page_id: item.id,
                    fcreate: item.fcreate,
                    fread: item.fread,
                    fupdate: item.fupdate,
                    fdelete: item.fdelete,
                };
                const [query, val] = crud.insertItem(
                    "mst_page_access",
                    insertedItem,
                    "user_group_name"
                );
                return connect.query(query, val);
            });

            const insertion = await Promise.all([
                ...promisesSubmit,
                connect.query(TRANS.COMMIT),
            ]);
            return {
                name: insertion[0].rows[0].user_group_name,
            };
        } catch (error) {
            await connect.query(TRANS.ROLLBACK);
            console.error(error);
            throw error;
        } finally {
            connect.release();
        }
    },

    showRole: async () => {
        const client = await db.connect();
        try {
            const q = `select id_role, role from mst_role`;
            const roles = await client.query(q);
            return {
                count: roles.rowCount,
                data: roles.rows,
            };
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            client.release();
        }
    },

    showManagers: async () => {
        const client = await db.connect();
        try {
            const q = `select mgr_id, fullname from mst_mgr`;
            const managers = await client.query(q);
            return {
                count: managers.rowCount,
                data: managers.rows,
            };
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            client.release();
        }
    },
};

module.exports = User;
