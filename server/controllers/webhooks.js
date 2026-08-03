import { Webhook } from "svix";
import User from "../models/User.js";
import { request, response } from "express";
import Stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";

//API controller Function
export const clerkWebhooks = async (req, res) => {
  try {
    const signingSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!signingSecret) {
      console.error("CLERK_WEBHOOK_SECRET belum dikonfigurasi");
      return res.status(500).json({
        success: false,
        message: "Webhook secret belum dikonfigurasi",
      });
    }

    const svixId = req.headers["svix-id"];
    const svixTimestamp = req.headers["svix-timestamp"];
    const svixSignature = req.headers["svix-signature"];

    if (!svixId || !svixTimestamp || !svixSignature) {
      return res.status(400).json({
        success: false,
        message: "Header Svix tidak lengkap",
      });
    }

    // express.raw() menghasilkan Buffer
    const payload = req.body.toString("utf8");

    const webhook = new Webhook(signingSecret);

    const event = webhook.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });

    const { type, data } = event;

    console.log("Clerk webhook diterima:", type);
    console.log("Clerk user ID:", data.id);

    switch (type) {
      case "user.created": {
        const primaryEmail =
          data.email_addresses?.find(
            (email) => email.id === data.primary_email_address_id
          )?.email_address ??
          data.email_addresses?.[0]?.email_address;

        await User.findByIdAndUpdate(
          data.id,
          {
            name:
              [data.first_name, data.last_name].filter(Boolean).join(" ") ||
              "Pengguna",
            email: primaryEmail,
            imageUrl: data.image_url,
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );

        break;
      }

      case "user.updated": {
        const primaryEmail =
          data.email_addresses?.find(
            (email) => email.id === data.primary_email_address_id
          )?.email_address ??
          data.email_addresses?.[0]?.email_address;

        await User.findByIdAndUpdate(
          data.id,
          {
            name:
              [data.first_name, data.last_name].filter(Boolean).join(" ") ||
              "Pengguna",
            email: primaryEmail,
            imageUrl: data.image_url,
          },
          {
            new: true,
            runValidators: true,
          }
        );

        break;
      }

      case "user.deleted": {
        const deletedUser = await User.findByIdAndDelete(data.id);

        if (deletedUser) {
          console.log(
            `User ${data.id} berhasil dihapus dari MongoDB`
          );
        } else {
          console.log(
            `User ${data.id} tidak ditemukan di MongoDB`
          );
        }

        break;
      }

      default: {
        console.log(`Event Clerk tidak ditangani: ${type}`);
        break;
      }
    }

    return res.status(200).json({
      success: true,
      received: true,
    });
  } catch (error) {
    console.error("Clerk webhook error:", error);

    return res.status(400).json({
      success: false,
      message: "Verifikasi atau pemrosesan webhook gagal",
    });
  }
};

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)

export const stripeWebhooks = async (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = Stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  }
  catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      const session = await stripeInstance.checkout. sessions.list({
        payment_intent: paymentIntentId
        })
        
        const { purchaseId } = session.data[0].metadata;
        
        const purchaseData = await Purchase.findById(purchaseId)
        const userData = await User.findById(purchaseData.userId)
        const courseData = await Course.findById(purchaseData.courseId.toString())
        
        courseData.enrolledStudents.push(userData)
        await courseData.save()
        
        userData.enrolledCourses.push(courseData._id)
        await userData.save()
        
        purchaseData.status = 'completed'
        await purchaseData.save()
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId
      })

      const { purchaseId } = session.data[0].metadata;
      const purchaseData = await Purchase.findById(purchaseId)
      purchaseData.status = 'failed'
      await purchaseData.save()

      break;
    }
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  response.json({received: true});

}
