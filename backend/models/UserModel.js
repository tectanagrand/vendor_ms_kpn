const db = require("../config/connection.js");
const uuid = require("uuidv4");
const jwt = require("jsonwebtoken");
const { hashPassword, validatePassword } = require("../middleware/hashpass.js");
const TRANS = require("../config/transaction.js");
const crud = require("../helper/crudquery.js");

const User = {
    showAll: () => {
        const row = db.query(`SELECT * FROM mst_user`);
        return row;
    },
    createUser: async params => {
        const client = await db.connect();
        client.query(TRANS.BEGIN);
        let pass = await hashPassword(params.password);
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
        const mgr_id = params.mgr_id;
        const role = params.role;
        const userSubmit = {
            fullname: fullname,
            username: username,
            email: email,
            role: role,
            password: pass,
            created_at: startDate,
            expired_date: validDate,
            updated_at: currentdate,
            is_active: true,
            user_group: userGroup,
            user_id: user_id,
            mgr_id: mgr_id,
            token: token,
        };
        const [query, val] = crud.insertItem(
            "mst_user",
            userSubmit,
            "username"
        );

        console.log(query, val);
        try {
            const insertUser = await client.query(query, val);
            await client.query(TRANS.COMMIT);
            return { name: insertUser.rows[0].username };
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            throw error;
        }
    },

    showUserData: async idUser => {
        const q = `select * from mst_user where user_id = '${idUser}'`;
        try {
            const showUserbyId = await db.query(q);
            return {
                count: showUserbyId.rowCount,
                data: showUserbyId.rows,
            };
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    createManager: async params => {
        const client = await db.connect();
        let pass = await hashPassword(params.password);
        const token = jwt.sign(
            { username: params.username },
            process.env.TOKEN_KEY,
            { expiresIn: "1d" }
        );
        const currentdate = new Date().toLocaleDateString();
        const startDate = params.date;
        const validDate = params.date;
        const user_id = uuid.uuid();
        const fullname = params.fullname;
        const username = params.username;
        const email = params.email;
        const userGroup = params.usergroup;
        const department = params.department;
        const userSubmit = {
            fullname: fullname,
            username: username,
            email: email,
            role: role,
            password: pass,
            created_at: startDate,
            expired_date: validDate,
            updated_at: currentdate,
            is_active: true,
            department: department,
            user_group: userGroup,
            mgr_id: user_id,
            token: token,
        };
        const [query, val] = crud.insertItem("mst_mgr", userSubmit, "username");
        try {
            const insertUserMgr = client.query(query, val);
            return { name: insertUserMgr.rows[0].username };
        } catch (error) {
            return {
                message: error,
            };
        }
    },

    checkUserExist: async (user_email, username) => {
        const connect = await db.connect();
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
        if (checkExistemaila.rowCount > 0 || checkExistemailb.rowCount > 0) {
            messages.push("Email already exist");
            status = false;
        }
        if (checkExistUnamea.rowCount > 0 || checkExistUnameb.rowCount > 0) {
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
    },
    loginUser: async ({ username, password }) => {
        try {
            let newtoken = "";
            const userData = await db.query(
                `SELECT * FROM MST_USER WHERE username = '${username}'`
            );
            if (userData.rows.length === 0) {
                throw new Error("User not found");
            }
            const hashed = userData.rows[0].password;
            const valid = validatePassword({ password, hashed });
            if (valid === false) {
                throw new Error("Password false");
            }
            const resdata = userData.rows[0];
            newtoken = jwt.sign(
                {
                    id: resdata.user_id,
                    username: resdata.username,
                    email: resdata.email,
                },
                process.env.TOKEN_KEY,
                { expiresIn: "1d" }
            );
            try {
                await db.query(TRANS.BEGIN);
                await db.query(
                    `UPDATE MST_USER SET token = '${newtoken}' where user_id ='${resdata.user_id}'`
                );
                await db.query(TRANS.COMMIT);
            } catch (error) {
                await db.query(TRANS.ROLLBACK);
                throw error;
            }
            return {
                fullname: resdata.fullname,
                username: resdata.username,
                id: resdata.user_id,
                email: resdata.email,
                role: resdata.department,
                token: newtoken,
            };
        } catch (error) {
            console.log(error);
            throw err;
        }
    },

    showExistSecGrp: async () => {
        const q = `select distinct user_group_name, user_group_id from mst_page_access`;
        const userGroups = await db.query(q);
        return {
            count: userGroups.rowCount,
            data: userGroups.rows,
        };
    },

    showSecurityGroup: async group_id => {
        const secMtxq = `SELECT HEADER.MENU_ID AS "parent",
                            HEADER.MENU_ID AS "id",
                            HEADER.PAGE,
                            FALSE AS "fcreate",
                            FALSE AS "fread",
                            FALSE AS "fupdate",
                            FALSE AS "fdelete"
                        FROM MST_PAGE HEADER
                        LEFT JOIN MST_PAGE CHILD ON HEADER.PARENT_ID = CHILD.MENU_ID 
                        UNION
                        select 
                            header.menu_id as "parent",
                            acc.page_id as "id",
                            pg.page as "page",
                            fcreate as "fcreate" ,
                            fread as "fcreate",
                            fupdate as "fcreate",
                            fdelete as "fcreate"	
                        from mst_page_access acc 
                        left join mst_page pg on acc.page_id = pg.menu_id
                        left join mst_page header on header.parent_id = acc.page_id
                        where user_group_id = '${group_id}'
                        order by parent asc
                        `;
        const secMtx = await db.query(secMtxq);
        return {
            count: secMtx.rowCount,
            data: secMtx.rows,
        };
    },

    submitSecurityGroup: async (groupname, accessmtx) => {
        const connect = await db.connect();
        try {
            let group_id = "d780b198-133e-491f-b6b2-3ceb9459addc";
            await connect.query(TRANS.BEGIN);
            if (group_id != "") {
                await connect.query(
                    `delete from mst_page_access where user_group_id = '${group_id}' ;`
                );
                console.log("in");
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
                console.log(query, val);
                return connect.query(query, val);
            });

            const insertion = Promise.all([
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
        }
    },

    showRole: async () => {
        try {
            const q = `select id_role, role from mst_role`;
            const roles = await db.query(q);
            return {
                count: roles.rowCount,
                data: roles.rows,
            };
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    showManagers: async () => {
        try {
            const q = `select mgr_id, fullname from mst_mgr`;
            const managers = await db.query(q);
            return {
                count: managers.rowCount,
                data: managers.rows,
            };
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
};

module.exports = User;
