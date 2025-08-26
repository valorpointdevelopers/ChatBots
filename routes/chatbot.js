const router = require('express').Router()
const { query } = require('../database/dbpromise.js')
const bcrypt = require('bcrypt')
const { sign } = require('jsonwebtoken')
const validateUser = require('../middlewares/user.js')
const moment = require('moment')
const { isValidEmail, encodeObject, readJSONFile, getFileExtension, areMobileNumbersFilled } = require('../functions/function.js')
const randomstring = require('randomstring')
const { getSession, } = require('../middlewares/req.js')
const csv = require('csv-parser');
const mime = require('mime-types')
const { checkPlanExpiry, checkChatbotPlan } = require('../middlewares/planValidator.js')

// add bot 
router.post('/add_bot', validateUser, checkPlanExpiry, checkChatbotPlan, async (req, res) => {
    try {
        const { title, for_all, prevent_book_id, flow, instance_id } = req.body

        if (!title || !flow || !instance_id) {
            return res.json({
                msg: "Please select the required fields"
            })
        }

        if (!for_all) {
            if (!prevent_book_id) {
                return res.json({
                    msg: "Your forgot to select prevent phonebook"
                })
            }

        }
        // check existing bot 
        const getBot = await query(`SELECT * FROM chatbot WHERE uid = ? AND instance_id = ?`, [
            req.decode.uid,
            instance_id
        ])

        if (getBot.length > 0) {
            return res.json({ msg: "This instance is already busy with another chtbot" })
        }

        await query(`INSERT INTO chatbot (uid, title, for_all, prevent_book_id, flow, active, instance_id) VALUES (?,?,?,?,?,?,?)`, [
            req.decode.uid,
            title,
            for_all ? 1 : 0,
            prevent_book_id,
            JSON.stringify(flow),
            1,
            instance_id
        ])

        res.json({
            success: true,
            msg: "Chatbot was added"
        })

    } catch (err) {
        res.json({ success: false, msg: "something went wrong", err })
        console.log(err)
    }
})

// update bot 
router.post('/update_bot', validateUser, checkPlanExpiry, checkChatbotPlan, async (req, res) => {
    try {
        const { title, for_all, prevent_book_id, flow, instance_id, id } = req.body


        if (!title || !flow || !instance_id) {
            return res.json({
                msg: "Please select the required fields"
            })
        }

        if (!for_all) {
            if (!prevent_book_id) {
                return res.json({
                    msg: "Your forgot to select prevent phonebook"
                })
            }

        }

        // check existing bot 
        const getBot = await query(`SELECT * FROM chatbot WHERE uid = ? AND instance_id = ?`, [
            req.decode.uid,
            instance_id
        ])

        if (getBot.length > 0 && parseFloat(id) !== parseFloat(getBot[0]?.id)) {
            return res.json({ msg: "This instance is already busy with another chtbot" })
        }

        await query(`UPDATE chatbot SET title = ?, for_all = ?, prevent_book_id = ?, flow = ?,
        instance_id = ? WHERE id = ? AND uid = ?`, [
            title,
            for_all ? 1 : 0,
            prevent_book_id,
            JSON.stringify(flow),
            instance_id,
            id,
            req.decode.uid
        ])

        res.json({
            msg: "Chatbot was updated",
            success: true
        })

    } catch (err) {
        res.json({ success: false, msg: "something went wrong", err })
        console.log(err)
    }
})

// get my chatbots 
router.get('/get_mine', validateUser, async (req, res) => {
    try {
        const data = await query(`SELECT * FROM chatbot WHERE uid = ?`, [req.decode.uid])
        res.json({ data, success: true })

    } catch (err) {
        res.json({ success: false, msg: "something went wrong", err })
        console.log(err)
    }
})

// change bot status 
router.post('/change_bot_status', validateUser, checkPlanExpiry, checkChatbotPlan, async (req, res) => {
    try {
        const { botId, status } = req.body

        if (!botId) {
            return res.json({ msg: "Invalid request found" })
        }

        await query(`UPDATE chatbot SET active = ? WHERE id = ? AND uid = ?`, [
            status ? 1 : 0,
            botId,
            req.decode.uid
        ])

        res.json({ msg: "Acivation changed", success: true })

    } catch (err) {
        res.json({ success: false, msg: "something went wrong", err })
        console.log(err)
    }
})

// del bot 
router.post('/del_bot', validateUser, async (req, res) => {
    try {
        const { id } = req.body
        await query(`DELETE FROM chatbot WHERE id = ? AND uid = ?`, [id, req.decode.uid])

        res.json({
            msg: "Chatbot was deleted",
            success: true
        })

    } catch (err) {
        res.json({ success: false, msg: "something went wrong", err })
        console.log(err)
    }
})

module.exports = router