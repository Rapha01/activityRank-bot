import { event } from '@activityrank/lupus';

export default event(event.discord.Error, function (error) {
  console.log('Client registered an error', error);
});
